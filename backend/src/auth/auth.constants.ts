export const SESSION_COOKIE_DEVELOPMENT = 'lumi_session'
export const SESSION_COOKIE_PRODUCTION = '__Host-lumi_session'
export const CSRF_COOKIE_DEVELOPMENT = 'lumi_csrf'
export const CSRF_COOKIE_PRODUCTION = '__Host-lumi_csrf'

export const AUTH_MESSAGES = {
  registrationAccepted:
    'If the address can be registered, an email verification link will be sent.',
  recoveryAccepted:
    'If the address belongs to an account, a password reset link will be sent.',
  invalidCredentials: 'Invalid email address or password.',
} as const
