<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useChatsStore } from '@/stores/chats.store'
import { sendCode, verifyCode, OperationType } from '@/api/code.api'
import { generatePublicKey } from '@/utils/crypto'
import CodeVerifyStep from './CodeVerifyStep.vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const router = useRouter()
const auth = useAuthStore()
const chatsStore = useChatsStore()

// Steps: 'email' → 'verify' → 'form'
const step = ref('email')

const email = ref('')
const firstName = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const codeLoading = ref(false)
const sendingCode = ref(false)

async function handleSendCode() {
  error.value = ''
  if (!email.value) { error.value = 'Enter your email'; return }
  sendingCode.value = true
  try {
    await sendCode({ email: email.value, operationType: OperationType.Register })
    step.value = 'verify'
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Failed to send code. Check the email address.'
  } finally {
    sendingCode.value = false
  }
}

async function handleVerify(code) {
  error.value = ''
  codeLoading.value = true
  try {
    const res = await verifyCode({ email: email.value, code, operationType: OperationType.Register })
    const valid = res.data?.data?.valid ?? res.data?.valid
    if (!valid) { error.value = 'Invalid or expired code'; return }
    step.value = 'form'
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Verification failed'
  } finally {
    codeLoading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  if (!firstName.value) { error.value = 'Enter your first name'; return }
  if (password.value.length < 8) { error.value = 'Password must be at least 8 characters'; return }
  if (password.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }

  try {
    await auth.register({
      email: email.value,
      firstName: firstName.value,
      password: password.value,
      publicKey: generatePublicKey(),
    })
    // Auto-login
    await auth.login(email.value, password.value)
    await chatsStore.fetchChats()
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Registration failed'
  }
}

async function handleResend() {
  try {
    await sendCode({ email: email.value, operationType: OperationType.Register })
  } catch {
    // silently fail — cooldown ui handles visual feedback
  }
}
</script>

<template>
  <div class="register-form">
    <!-- Step 1: Email -->
    <Transition name="fade" mode="out-in">
      <div v-if="step === 'email'" key="email" class="step">
        <div class="form-group">
          <label class="form-label" for="reg-email">Email</label>
          <input
            id="reg-email"
            v-model="email"
            class="form-input"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            @keyup.enter="handleSendCode"
          />
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn btn-primary btn-full" :disabled="sendingCode" @click="handleSendCode">
          <AppSpinner v-if="sendingCode" size="sm" />
          <span v-else>Send verification code</span>
        </button>
      </div>

      <!-- Step 2: Verify code -->
      <div v-else-if="step === 'verify'" key="verify" class="step">
        <CodeVerifyStep
          :email="email"
          :loading="codeLoading"
          :error="error"
          @submit="handleVerify"
          @resend="handleResend"
        />
        <button class="btn btn-ghost step__back" @click="step = 'email'">← Back</button>
      </div>

      <!-- Step 3: Fill in details -->
      <div v-else-if="step === 'form'" key="form" class="step">
        <div class="form-group">
          <label class="form-label" for="reg-fname">First name</label>
          <input
            id="reg-fname"
            v-model="firstName"
            class="form-input"
            type="text"
            placeholder="Your first name"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-pass">Password</label>
          <input
            id="reg-pass"
            v-model="password"
            class="form-input"
            type="password"
            placeholder="Min. 8 characters"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-pass2">Confirm password</label>
          <input
            id="reg-pass2"
            v-model="confirmPassword"
            class="form-input"
            type="password"
            placeholder="Repeat password"
            autocomplete="new-password"
            @keyup.enter="handleRegister"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button class="btn btn-primary btn-full" :disabled="auth.isLoading" @click="handleRegister">
          <AppSpinner v-if="auth.isLoading" size="sm" />
          <span v-else>Create account</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.step__back {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  align-self: flex-start;
  padding: var(--space-xs) 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
