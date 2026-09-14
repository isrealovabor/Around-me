export class ApiError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503, message: string, public readonly code: string) {
    super(message)
  }
}

export const notFound = (message = 'Resource not found') => new ApiError(404, message, 'NOT_FOUND')
export const forbidden = (message = 'You do not have permission to perform this action') => new ApiError(403, message, 'FORBIDDEN')
