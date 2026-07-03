export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

export const badRequest = (m = "Bad request") => new ApiError(400, m)
export const notFound = (m = "Not found") => new ApiError(404, m)
export const notImplemented = (m = "Not implemented") => new ApiError(501, m)
