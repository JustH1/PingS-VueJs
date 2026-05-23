<script setup>
import { ref } from 'vue'
import AppSpinner from '@/components/shared/AppSpinner.vue'

const props = defineProps({
  payload: {
    type: Object,
    default: () => ({
      title: 'Confirm',
      message: 'Are you sure?',
      confirmText: 'Confirm',
      danger: false,
      onConfirm: null,
    }),
  },
})

const emit = defineEmits(['close'])
const loading = ref(false)

async function handleConfirm() {
  if (!props.payload?.onConfirm) { emit('close'); return }
  loading.value = true
  try {
    await props.payload.onConfirm()
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <h3 class="modal__title">{{ payload?.title ?? 'Confirm' }}</h3>
      <p class="modal__message">{{ payload?.message ?? 'Are you sure?' }}</p>

      <div class="modal__actions">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button
          class="btn"
          :class="payload?.danger ? 'btn-danger' : 'btn-primary'"
          :disabled="loading"
          @click="handleConfirm"
        >
          <AppSpinner v-if="loading" size="sm" />
          <span v-else>{{ payload?.confirmText ?? 'Confirm' }}</span>
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
  max-width: 360px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.modal__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal__message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
