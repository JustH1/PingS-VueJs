import { userApi } from './axios'

// operationType enum
export const OperationType = {
  Register: 0,
  ChangePassword: 1,
  ChangeEmail: 2,
}

/**
 * Send a 6-digit verification code to the given email.
 * @param {{ email: string, operationType: number }} payload
 */
export function sendCode(payload) {
  return userApi.post('/api/code/send', payload)
}

/**
 * Verify a 6-digit code.
 * @param {{ email: string, code: string, operationType: number }} payload
 */
export function verifyCode(payload) {
  return userApi.post('/api/code/verify', payload)
}
