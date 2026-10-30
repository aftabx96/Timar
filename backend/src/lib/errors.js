// Errors the API is allowed to show to the user. Anything else becomes a generic 500.
export class ApiError extends Error {
  constructor(status, message, { code, field, details } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
    this.details = details
  }
}

export const badRequest = (message, opts) => new ApiError(400, message, opts)
export const unauthorized = (message = 'Please sign in.', opts) => new ApiError(401, message, { code: 'unauthorized', ...opts })
export const forbidden = (message = 'You do not have access to this.', opts) => new ApiError(403, message, { code: 'forbidden', ...opts })
export const conflict = (message, opts) => new ApiError(409, message, opts)
export const tooMany = (message, opts) => new ApiError(429, message, { code: 'rate_limited', ...opts })

// Wraps async route handlers so thrown errors reach the error middleware (Express 4).
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
