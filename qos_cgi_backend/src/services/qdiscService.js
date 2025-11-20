const fs = require('fs');
const path = require('path');

/**
 * QdiscService provides CRUD over an in-file JSON store and abstracts system-level
 * interactions so we can later swap in real `tc qdisc` commands.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const QDISC_FILE = path.join(DATA_DIR, 'qdisks.json');

// Ensure data directory/file exist
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(QDISC_FILE)) fs.writeFileSync(QDISC_FILE, JSON.stringify({}), 'utf-8');
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(QDISC_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeStore(obj) {
  ensureStore();
  fs.writeFileSync(QDISC_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

// PUBLIC_INTERFACE
/**
 * Build a default id if not provided
 */
function buildId({ id, device, parent = 'root', kind }) {
  if (id && typeof id === 'string' && id.trim().length > 0) return id;
  return `${device}-${parent}-${kind}`;
}

// PUBLIC_INTERFACE
/**
 * Translate qdisc object to shell command arguments.
 * This is a stub that returns a string; actual execution is abstracted.
 */
function buildQdiscCommand(op, qdisc) {
  const base = ['tc', 'qdisc', op];
  const parts = [...base, 'dev', qdisc.device];

  if (op === 'add' || op === 'replace' || op === 'change') {
    if (qdisc.parent) parts.push('parent', qdisc.parent);
    if (qdisc.handle) parts.push('handle', qdisc.handle);
    parts.push('root' === qdisc.parent ? 'root' : '');
    parts.push('clsact' === qdisc.kind ? 'clsact' : '');
    parts.push(''.trim()); // no-op to keep spacing predictable
    parts.push(qdisc.kind);
    // Append params
    const params = qdisc.params || {};
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      parts.push(k, String(v));
    });
  } else if (op === 'del' || op === 'delete') {
    if (qdisc.parent) parts.push('parent', qdisc.parent);
    if (qdisc.handle) parts.push('handle', qdisc.handle);
  }

  return parts.filter(Boolean).join(' ');
}

// PUBLIC_INTERFACE
/**
 * Stub executor to simulate system interaction. Later this can be replaced
 * with child_process.exec or a specialized runner.
 */
async function execQdisc(commandString) {
  const mode = process.env.QDISC_EXEC_MODE || 'stub';
  if (mode === 'stub') {
    // No-op, pretend success
    return { ok: true, command: commandString, output: 'stub-success' };
  }
  // In future: actually execute
  // const { exec } = require('child_process');
  // ...
  return { ok: false, command: commandString, output: 'unsupported mode' };
}

class QdiscService {
  // PUBLIC_INTERFACE
  /**
   * List all qdiscs from the store
   */
  async list() {
    const data = readStore();
    return Object.values(data);
  }

  // PUBLIC_INTERFACE
  /**
   * Get by id
   */
  async get(id) {
    const data = readStore();
    return data[id] || null;
  }

  // PUBLIC_INTERFACE
  /**
   * Create a qdisc; writes to store and stubs system command.
   */
  async create(payload) {
    const data = readStore();
    const id = buildId(payload);
    if (data[id]) return null;

    const qdisc = { ...payload, id };
    // Build and execute system command (stubbed)
    const cmd = buildQdiscCommand('add', qdisc);
    await execQdisc(cmd);

    data[id] = qdisc;
    writeStore(data);
    return qdisc;
  }

  // PUBLIC_INTERFACE
  /**
   * Update an existing qdisc; also stub system command (replace/change)
   */
  async update(id, updates) {
    const data = readStore();
    if (!data[id]) return null;
    const updated = { ...data[id], ...updates };
    const cmd = buildQdiscCommand('replace', updated);
    await execQdisc(cmd);
    data[id] = updated;
    writeStore(data);
    return updated;
  }

  // PUBLIC_INTERFACE
  /**
   * Remove a qdisc; stub delete command
   */
  async remove(id) {
    const data = readStore();
    const existing = data[id];
    if (!existing) return false;
    const cmd = buildQdiscCommand('del', existing);
    await execQdisc(cmd);
    delete data[id];
    writeStore(data);
    return true;
  }
}

module.exports = new QdiscService();
module.exports._internal = { buildId, buildQdiscCommand, execQdisc };
