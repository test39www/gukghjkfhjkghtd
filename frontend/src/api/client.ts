import { getBackendUrl } from "../storage"
import { ApiError, NetworkError } from "../utils/errors"

/** Обёртка над fetch с обработкой ошибок сети и API. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  baseOverride?: string
): Promise<T> {
  const base = (baseOverride ?? (await getBackendUrl())).replace(/\/$/, "")
  const url = `${base}${path}`

  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new NetworkError(
      "Нет соединения с сервером. Проверьте backend URL в настройках и сеть."
    )
  }

  if (!res.ok) {
    let message = `Ошибка сервера (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = String(body.error)
    } catch {
      /* тело не JSON — оставляем стандартное сообщение */
    }
    throw new ApiError(res.status, message)
  }

  return (await res.json()) as T
}
