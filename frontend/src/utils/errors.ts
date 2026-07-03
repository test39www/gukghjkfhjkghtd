/** Ошибка сети (нет соединения с backend). */
export class NetworkError extends Error {
  constructor(message = "Нет соединения с сервером") {
    super(message)
    this.name = "NetworkError"
  }
}

/** Ошибка ответа API (не 2xx). */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}
