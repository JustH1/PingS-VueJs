<script setup>
import { ref, computed, onMounted } from 'vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const props = defineProps({
  email: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'resend'])

const digits = ref(['', '', '', '', '', ''])
const inputs = ref([])
const cooldown = ref(0)
let cooldownTimer = null

const code = computed(() => digits.value.join(''))
const canSubmit = computed(() => code.value.length === 6 && !props.loading)

onMounted(() => {
  inputs.value[0]?.focus()
  startCooldown()
})

function startCooldown() {
  cooldown.value = 60
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

function onInput(index, event) {
  const val = event.target.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = val
  if (val && index < 5) {
    inputs.value[index + 1]?.focus()
  }
  if (code.value.length === 6) {
    emit('submit', code.value)
  }
}

function onKeydown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    digits.value[index - 1] = ''
    inputs.value[index - 1]?.focus()
  }
}

function onPaste(event) {
  const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  if (text.length === 6) {
    text.split('').forEach((ch, i) => (digits.value[i] = ch))
    inputs.value[5]?.focus()
    emit('submit', text)
    event.preventDefault()
  }
}

function handleResend() {
  if (cooldown.value > 0) return
  digits.value = ['', '', '', '', '', '']
  inputs.value[0]?.focus()
  startCooldown()
  emit('resend')
}
</script>

<template>
  <div class="code-step">
    <p class="code-step__hint">
      Enter the 6-digit code sent to <strong>{{ email }}</strong>
    </p>

    <div class="code-step__boxes" @paste="onPaste">
      <input
        v-for="(_, i) in digits"
        :key="i"
        ref="inputs"
        class="code-step__box"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :value="digits[i]"
        @input="onInput(i, $event)"
        @keydown="onKeydown(i, $event)"
        autocomplete="off"
      />
    </div>

    <p v-if="error" class="code-step__error">{{ error }}</p>

    <div class="code-step__actions">
      <button
        class="btn btn-primary btn-full"
        :disabled="!canSubmit"
        @click="emit('submit', code)"
      >
        <AppSpinner v-if="loading" size="sm" />
        <span v-else>Verify</span>
      </button>

      <button
        class="btn btn-ghost code-step__resend"
        :disabled="cooldown > 0"
        @click="handleResend"
      >
        {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.code-step {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.code-step__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
}
.code-step__hint strong {
  color: var(--color-text-primary);
}

.code-step__boxes {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.code-step__box {
  width: 44px;
  height: 52px;
  text-align: center;
  font-size: var(--font-size-xl);
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--color-bg-input);
  border: 1.5px solid var(--color-border);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}
.code-step__box:focus {
  border-color: var(--color-accent-light);
  outline: none;
}

.code-step__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  text-align: center;
}

.code-step__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.code-step__resend {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
