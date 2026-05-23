<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { sendCode, verifyCode, OperationType } from '@/api/code.api'
import CodeVerifyStep from '@/components/auth/CodeVerifyStep.vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const emit = defineEmits(['close'])

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const tab = ref('profile') // 'profile' | 'security'

// Profile tab
const profileForm = reactive({
  firstName: auth.currentUser?.firstName ?? '',
  lastName: auth.currentUser?.lastName ?? '',
  userName: auth.currentUser?.userName ?? '',
})
const profileError = ref('')
const profileSuccess = ref(false)

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = false
  if (!profileForm.firstName.trim()) { profileError.value = 'First name is required'; return }
  if (profileForm.userName && !/^[a-zA-Z0-9_]{2,32}$/.test(profileForm.userName)) {
    profileError.value = 'Username: 2-32 chars, letters/numbers/underscore only'; return
  }
  try {
    await auth.updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim() || null,
      userName: profileForm.userName.trim(),
    })
    profileSuccess.value = true
    ui.showToast('Profile updated', 'success')
    setTimeout(() => { profileSuccess.value = false }, 2000)
  } catch (e) {
    profileError.value = e.response?.data?.message ?? 'Update failed'
  }
}

// Security tab — change password (with email verification)
const passStep = ref('form') // 'form' | 'verify'
const passForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passError = ref('')
const passLoading = ref(false)
const codeLoading = ref(false)
const codeError = ref(''  )

async function sendPassCode() {
  passError.value = ''
  if (!passForm.currentPassword) { passError.value = 'Enter your current password'; return }
  if (passForm.newPassword.length < 8) { passError.value = 'New password must be at least 8 characters'; return }
  if (passForm.newPassword !== passForm.confirmPassword) { passError.value = 'Passwords do not match'; return }
  passLoading.value = true
  try {
    await sendCode({ email: auth.currentUser?.email, operationType: OperationType.ChangePassword })
    passStep.value = 'verify'
  } catch (e) {
    passError.value = e.response?.data?.message ?? 'Failed to send code'
  } finally {
    passLoading.value = false
  }
}

async function verifyPassCode(code) {
  codeError.value = ''
  codeLoading.value = true
  try {
    const res = await verifyCode({
      email: auth.currentUser?.email,
      code,
      operationType: OperationType.ChangePassword,
    })
    const valid = res.data?.data?.valid ?? res.data?.valid
    if (!valid) { codeError.value = 'Invalid or expired code'; return }
    // Code verified — change password
    await auth.changePassword({
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    })
    ui.showToast('Password changed successfully', 'success')
    passStep.value = 'form'
    passForm.currentPassword = ''
    passForm.newPassword = ''
    passForm.confirmPassword = ''
  } catch (e) {
    codeError.value = e.response?.data?.message ?? 'Failed to change password'
  } finally {
    codeLoading.value = false
  }
}

async function resendPassCode() {
  try {
    await sendCode({ email: auth.currentUser?.email, operationType: OperationType.ChangePassword })
  } catch { /* silent */ }
}

function getInitials() {
  const u = auth.currentUser
  if (!u) return '?'
  return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? u.firstName?.[1] ?? '')).toUpperCase()
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h3 class="modal__title">Profile</h3>
        <button class="icon-btn" @click="emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Avatar + name -->
      <div class="modal__avatar-block">
        <div class="modal__avatar">{{ getInitials() }}</div>
        <div>
          <div class="modal__display-name">{{ auth.displayName }}</div>
          <div v-if="auth.currentUser?.email" class="modal__email">{{ auth.currentUser.email }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="modal__tabs">
        <button class="modal__tab" :class="{ 'modal__tab--active': tab === 'profile' }" @click="tab = 'profile'">Profile</button>
        <button class="modal__tab" :class="{ 'modal__tab--active': tab === 'security' }" @click="tab = 'security'">Security</button>
      </div>

      <!-- Profile tab -->
      <div v-if="tab === 'profile'" class="modal__body">
        <div class="form-group">
          <label class="form-label">First name</label>
          <input v-model="profileForm.firstName" class="form-input" type="text" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Last name</label>
          <input v-model="profileForm.lastName" class="form-input" type="text" maxlength="100" placeholder="Optional" />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input v-model="profileForm.userName" class="form-input" type="text" maxlength="32" placeholder="@username" />
        </div>
        <p v-if="profileError" class="form-error">{{ profileError }}</p>
        <p v-if="profileSuccess" class="modal__success">✓ Profile updated</p>
        <button class="btn btn-primary btn-full" :disabled="auth.isLoading" @click="saveProfile">
          <AppSpinner v-if="auth.isLoading" size="sm" />
          <span v-else>Save changes</span>
        </button>
      </div>

      <!-- Security tab -->
      <div v-else class="modal__body">
        <Transition name="fade" mode="out-in">
          <div v-if="passStep === 'form'" key="form" class="step">
            <div class="form-group">
              <label class="form-label">Current password</label>
              <input v-model="passForm.currentPassword" class="form-input" type="password" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label class="form-label">New password</label>
              <input v-model="passForm.newPassword" class="form-input" type="password" placeholder="Min. 8 characters" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm new password</label>
              <input v-model="passForm.confirmPassword" class="form-input" type="password" placeholder="Repeat password" />
            </div>
            <p v-if="passError" class="form-error">{{ passError }}</p>
            <button class="btn btn-primary btn-full" :disabled="passLoading" @click="sendPassCode">
              <AppSpinner v-if="passLoading" size="sm" />
              <span v-else>Change password</span>
            </button>
          </div>

          <div v-else key="verify" class="step">
            <CodeVerifyStep
              :email="auth.currentUser?.email ?? ''"
              :loading="codeLoading"
              :error="codeError"
              @submit="verifyPassCode"
              @resend="resendPassCode"
            />
            <button class="btn btn-ghost step__back" @click="passStep = 'form'">← Back</button>
          </div>
        </Transition>
      </div>

      <!-- Logout -->
      <div class="modal__footer">
        <button class="btn btn-ghost modal__logout" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-xl);
}

.modal {
  background: var(--color-bg-modal);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal__avatar-block {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.modal__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.modal__display-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal__email {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.modal__tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.modal__tab {
  flex: 1;
  padding: var(--space-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.modal__tab:hover { color: var(--color-text-primary); }
.modal__tab--active {
  color: var(--color-accent-light);
  border-bottom-color: var(--color-accent-light);
}

.modal__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal__success {
  font-size: var(--font-size-sm);
  color: var(--color-success);
}

.modal__footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-md);
}

.modal__logout {
  color: var(--color-danger);
  gap: var(--space-sm);
  display: flex;
  align-items: center;
}
.modal__logout:hover { background: rgba(229,57,53,0.1); }

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.step__back {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  align-self: flex-start;
}

.fade-enter-active,
.fade-leave-active { transition: opacity var(--transition-normal); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
