export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as
      | { message?: string | string[] }
      | null
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : body?.message ?? 'The request could not be completed.'
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function csrfHeaders(): Record<string, string> {
  const token = document.cookie
    .split('; ')
    .find((entry) =>
      entry.startsWith('lumi_csrf=') || entry.startsWith('__Host-lumi_csrf='),
    )
    ?.split('=')
    .slice(1)
    .join('=')

  return token ? { 'X-CSRF-Token': decodeURIComponent(token) } : {}
}

export function jsonBody(value: unknown): Pick<RequestInit, 'body' | 'headers'> {
  return {
    body: JSON.stringify(value),
    headers: { 'Content-Type': 'application/json' },
  }
}

export async function downloadApiFile(path: string, filename: string) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    headers: { Accept: 'text/csv' },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message ?? 'The export could not be downloaded.'
    throw new ApiError(message, response.status)
  }
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
