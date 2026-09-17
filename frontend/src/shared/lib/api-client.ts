import { getAuth } from 'firebase/auth'

export class ApiError extends Error {
  status: number
  code: string
  details?: object

  constructor(status: number, code: string, message: string, details?: object) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: object
  }
}

interface ApiSuccessBody<T> {
  data: T
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const token = await getAuth().currentUser?.getIdToken()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })

  if (response.status === 204) return null

  if (!response.ok) {
    let code = 'UNKNOWN'
    let message = response.statusText || 'Request failed'
    let details: object | undefined
    let errorBody: Partial<ApiErrorBody> | undefined
    try {
      errorBody = JSON.parse(await response.text()) as Partial<ApiErrorBody>
    } catch {
      errorBody = undefined
    }
    if (errorBody?.error) {
      code = errorBody.error.code
      message = errorBody.error.message
      details = errorBody.error.details
    }
    throw new ApiError(response.status, code, message, details)
  }

  const body = (await response.json()) as ApiSuccessBody<T>
  return body.data
}
