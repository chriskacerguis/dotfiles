// src/middleware/errorHandler.js
//
// The only place an HTTP failure is formatted. Register it last, after every
// route:  app.use(require('./middleware/errorHandler'));
//
// Contract: every failure response is  { error: { message, code?, details? } }.
// 5xx messages are always generic — the specifics go to the log, correlated by
// request id so a caller can quote it back.

const logger = require('../logger');
const { HttpError } = require('../lib/errors');

// Body-parser and similar libraries throw plain errors with well-known shapes.
// Normalize them here rather than leaking a 500 for a client-side mistake.
function normalize(err) {
  if (err instanceof HttpError) return err;

  if (err.type === 'entity.parse.failed') {
    return Object.assign(new Error('Malformed JSON in request body'), {
      status: 400,
      code: 'INVALID_JSON',
      expose: true,
    });
  }
  if (err.type === 'entity.too.large') {
    return Object.assign(new Error('Request body too large'), {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      expose: true,
    });
  }

  const status = err.status || err.statusCode || 500;
  return Object.assign(err, { status, expose: err.expose ?? status < 500 });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const error = normalize(err);
  const { status } = error;
  const log = req.log ?? logger;

  if (status >= 500) {
    log.error({ err: error, path: req.originalUrl, method: req.method }, 'Unhandled server error');
  } else {
    log.warn({ status, code: error.code, path: req.originalUrl }, error.message);
  }

  const body = {
    error: {
      message: error.expose ? error.message : 'Internal Server Error',
      ...(error.code && { code: error.code }),
      ...(error.expose && error.details && { details: error.details }),
    },
  };

  if (status === 429 && error.retryAfter) res.set('Retry-After', String(error.retryAfter));
  if (status === 401) res.set('WWW-Authenticate', 'Bearer');

  res.status(status).json(body);
}

module.exports = errorHandler;
