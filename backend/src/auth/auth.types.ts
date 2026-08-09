import type { UserRole } from '../generated/prisma/enums.js'

export type AuthenticatedUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
}

export type AuthenticatedSession = {
  id: string
  tokenHash: string
  csrfTokenHash: string
  expiresAt: Date
}

export type RequestAuthentication = {
  user: AuthenticatedUser
  session: AuthenticatedSession
}
