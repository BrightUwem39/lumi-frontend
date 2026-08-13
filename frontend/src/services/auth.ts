import { ApiError, apiRequest, csrfHeaders, jsonBody } from './api'

export type AuthUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'CUSTOMER' | 'STAFF' | 'ADMINISTRATOR'
}

type RegistrationResponse = {
  message: string
  development?: { verificationToken: string }
}

export async function getCurrentUser() {
  try {
    const response = await apiRequest<{ user: AuthUser }>('/auth/me')
    return response.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function registerCustomer(input: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  return apiRequest<RegistrationResponse>('/auth/register', {
    method: 'POST',
    ...jsonBody(input),
  })
}

export function verifyCustomerEmail(code: string) {
  return apiRequest<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    ...jsonBody({ code }),
  })
}

export function requestCustomerPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    ...jsonBody({ email }),
  })
}

export function resetCustomerPassword(token: string, newPassword: string) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    ...jsonBody({ token, newPassword }),
  })
}

export async function loginCustomer(email: string, password: string) {
  const response = await apiRequest<{ user: AuthUser; csrfToken: string }>(
    '/auth/login',
    { method: 'POST', ...jsonBody({ email, password }) },
  )
  return response.user
}

export function logoutCustomer() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    headers: csrfHeaders(),
  })
}
