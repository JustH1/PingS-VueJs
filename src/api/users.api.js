import { userApi } from './axios'

/** Get the current authenticated user's profile. */
export function getMe() {
  return userApi.get('/api/users/me')
}

/**
 * Update current user profile.
 * @param {{ firstName: string, lastName?: string, userName: string }} payload
 */
export function updateMe(payload) {
  return userApi.patch('/api/users/me', payload)
}

/**
 * Change the current user's password.
 * @param {{ currentPassword: string, newPassword: string }} payload
 */
export function changePassword(payload) {
  return userApi.patch('/api/users/me/password', payload)
}

/**
 * Change the current user's email.
 * @param {{ newEmail: string, currentPassword: string }} payload
 */
export function changeEmail(payload) {
  return userApi.patch('/api/users/me/email', payload)
}

/**
 * Get a public user profile by ID.
 * @param {number} id
 */
export function getUserById(id) {
  return userApi.get(`/api/users/${id}`)
}

/**
 * Search users by query string.
 * @param {string} q
 * @param {number} limit
 */
export function searchUsers(q, limit = 12) {
  return userApi.get('/api/users/search', { params: { q, limit } })
}
