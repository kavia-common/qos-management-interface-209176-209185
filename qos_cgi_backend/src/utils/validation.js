const allowedKinds = ['tbf', 'fq_codel', 'fq', 'pfifo_fast', 'cake', 'htb'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateKindSpecific(kind, params = {}) {
  const errors = [];
  if (kind === 'tbf') {
    if (!isNonEmptyString(params.rate)) errors.push('params.rate is required for tbf');
    if (!isNonEmptyString(params.burst)) errors.push('params.burst is required for tbf');
    if (!isNonEmptyString(params.latency)) errors.push('params.latency is required for tbf');
  }
  if (kind === 'fq_codel') {
    // fq_codel has reasonable defaults; optionally validate limit/target/interval/ecn
  }
  if (kind === 'fq') {
    // optional params like quantum/flow_limit
  }
  if (kind === 'pfifo_fast') {
    // usually no params
  }
  if (kind === 'cake') {
    // optional bandwidth/ack-filter/etc.
  }
  if (kind === 'htb') {
    // as qdisc root, usually no strict param requirements; classes are configured separately
  }
  return errors;
}

// PUBLIC_INTERFACE
function validateCreateQdisc(body) {
  const errors = [];
  const out = {};

  const device = body.device;
  if (!isNonEmptyString(device)) errors.push('device is required');

  const kind = body.kind;
  if (!isNonEmptyString(kind)) errors.push('kind is required');
  else if (!allowedKinds.includes(kind)) errors.push(`kind must be one of: ${allowedKinds.join(', ')}`);

  const parent = body.parent;
  if (parent !== undefined && !isNonEmptyString(parent)) errors.push('parent must be a non-empty string when provided');

  const handle = body.handle;
  if (handle !== undefined && !isNonEmptyString(handle)) errors.push('handle must be a non-empty string when provided');

  const params = body.params || {};
  const kindErrors = validateKindSpecific(kind, params);
  errors.push(...kindErrors);

  const id = body.id;
  if (id !== undefined && !isNonEmptyString(id)) errors.push('id must be a non-empty string when provided');

  if (errors.length) return { valid: false, errors };

  out.id = id;
  out.device = device.trim();
  out.parent = parent ? parent.trim() : undefined;
  out.handle = handle ? handle.trim() : undefined;
  out.kind = kind;
  out.params = params;

  return { valid: true, errors: [], data: out };
}

// PUBLIC_INTERFACE
function validateUpdateQdisc(body) {
  const allowed = ['device', 'parent', 'handle', 'kind', 'params'];
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  const errors = [];
  if (unknown.length) errors.push(`Unknown fields: ${unknown.join(', ')}`);

  if (body.device !== undefined && !isNonEmptyString(body.device)) errors.push('device must be non-empty string');
  if (body.parent !== undefined && !isNonEmptyString(body.parent)) errors.push('parent must be non-empty string');
  if (body.handle !== undefined && !isNonEmptyString(body.handle)) errors.push('handle must be non-empty string');
  if (body.kind !== undefined) {
    if (!isNonEmptyString(body.kind)) errors.push('kind must be non-empty string');
    else if (!allowedKinds.includes(body.kind)) errors.push(`kind must be one of: ${allowedKinds.join(', ')}`);
    const params = body.params || {};
    const kindErrors = validateKindSpecific(body.kind, params);
    errors.push(...kindErrors);
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true, errors: [], data: body };
}

module.exports = {
  validateCreateQdisc,
  validateUpdateQdisc,
};
