const qdiscService = require('../services/qdiscService');
const { validateCreateQdisc, validateUpdateQdisc } = require('../utils/validation');

function success(res, data, status = 200) {
  return res.status(status).json({ status: 'success', data });
}

function failure(res, message, status = 400, details = null) {
  const payload = { status: 'error', message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

class QdisksController {
  // PUBLIC_INTERFACE
  /**
   * List all qdiscs from the store
   */
  async list(req, res) {
    try {
      const qdisks = await qdiscService.list();
      return success(res, qdisks, 200);
    } catch (err) {
      return failure(res, 'Failed to list qdisks', 500, err.message);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a qdisc by id
   */
  async get(req, res) {
    try {
      const { id } = req.params;
      const qdisc = await qdiscService.get(id);
      if (!qdisc) return failure(res, 'Qdisc not found', 404);
      return success(res, qdisc, 200);
    } catch (err) {
      return failure(res, 'Failed to get qdisc', 500, err.message);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create a qdisc after validation. Idempotent: if identical exists, returns 200 with existing.
   */
  async create(req, res) {
    try {
      const { valid, errors, data } = validateCreateQdisc(req.body);
      if (!valid) return failure(res, 'Validation failed', 400, errors);

      const exists = await qdiscService.get(data.id);
      if (exists) {
        // If same content, treat as idempotent OK
        const same =
          exists.device === data.device &&
          (exists.parent || null) === (data.parent || null) &&
          (exists.handle || null) === (data.handle || null) &&
          exists.kind === data.kind &&
          JSON.stringify(exists.params || {}) === JSON.stringify(data.params || {});
        if (same) return success(res, exists, 200);
        return failure(res, 'Qdisc with this id already exists', 409);
      }

      const created = await qdiscService.create(data);
      return success(res, created, 201);
    } catch (err) {
      return failure(res, 'Failed to create qdisc', 500, err.message);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update an existing qdisc. If not found, 404.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { valid, errors, data } = validateUpdateQdisc(req.body);
      if (!valid) return failure(res, 'Validation failed', 400, errors);

      const updated = await qdiscService.update(id, data);
      if (!updated) return failure(res, 'Qdisc not found', 404);
      return success(res, updated, 200);
    } catch (err) {
      return failure(res, 'Failed to update qdisc', 500, err.message);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a qdisc
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const removed = await qdiscService.remove(id);
      if (!removed) return failure(res, 'Qdisc not found', 404);
      return success(res, { id, deleted: true }, 200);
    } catch (err) {
      return failure(res, 'Failed to delete qdisc', 500, err.message);
    }
  }
}

module.exports = new QdisksController();
