// src/lib/errors.js
//
// The one place HTTP failure semantics are defined. Any layer may throw these;
// only src/middleware/errorHandler.js turns them into a response.
//
//   const { NotFound } = require('../lib/errors');
//   if (!user) throw new NotFound('User not found');
//
// `details` is optional and surfaces to the client, so it must never carry
// internals. Attach anything private to `err.cause` instead — the handler logs
// it and never serializes it.

class HttpError extends Error {
  constructor(status, message, { code, details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = this.constructor.name;
    this.status = status;
    this.expose = status < 500; // may this message reach the client?
    if (code) this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class BadRequest extends HttpError {
  constructor(message = 'Bad request', opts) {
    super(400, message, { code: 'BAD_REQUEST', ...opts });
  }
}

class Unauthorized extends HttpError {
  constructor(message = 'Authentication required', opts) {
    super(401, message, { code: 'UNAUTHORIZED', ...opts });
  }
}

class Forbidden extends HttpError {
  constructor(message = 'Forbidden', opts) {
    super(403, message, { code: 'FORBIDDEN', ...opts });
  }
}

class NotFound extends HttpError {
  constructor(message = 'Not found', opts) {
    super(404, message, { code: 'NOT_FOUND', ...opts });
  }
}

class Conflict extends HttpError {
  constructor(message = 'Conflict', opts) {
    super(409, message, { code: 'CONFLICT', ...opts });
  }
}

class UnsupportedMediaType extends HttpError {
  constructor(message = 'Unsupported media type', opts) {
    super(415, message, { code: 'UNSUPPORTED_MEDIA_TYPE', ...opts });
  }
}

// Syntactically valid, semantically rejected by a business rule. Keep the
// 400/422 split consistent: 400 = shape, 422 = rule.
class UnprocessableContent extends HttpError {
  constructor(message = 'Unprocessable content', opts) {
    super(422, message, { code: 'UNPROCESSABLE_CONTENT', ...opts });
  }
}

class TooManyRequests extends HttpError {
  constructor(message = 'Too many requests', opts) {
    super(429, message, { code: 'TOO_MANY_REQUESTS', ...opts });
  }
}

class InternalError extends HttpError {
  constructor(message = 'Internal Server Error', opts) {
    super(500, message, { code: 'INTERNAL_ERROR', ...opts });
  }
}

module.exports = {
  HttpError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  UnsupportedMediaType,
  UnprocessableContent,
  TooManyRequests,
  InternalError,
};
