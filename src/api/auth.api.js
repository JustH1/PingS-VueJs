import { userApi } from './axios'

/**
 * Register a new user.
 * @param {{ email: string, firstName: string, password: string, publicKey: string }} payload
 */
export function register(payload) {
  return userApi.post('/api/v1/auth/register', payload)
}

/**
 * Login and receive a JWT token.
 * @param {{ email: string, password: string }} payload
 * @returns {{ token: string, userID: string }}
 */
export function login(payload) {
  return userApi.post('/api/v1/auth/login', payload)
}
