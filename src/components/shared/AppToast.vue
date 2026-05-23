<script setup>
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="ui.dismissToast(toast.id)"
        >
          <span class="toast__icon">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else-if="toast.type === 'warning'">!</span>
            <span v-else>i</span>
          </span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: flex-end;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  min-width: 200px;
  max-width: 360px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.toast--info    { background: var(--color-toast-info);    color: #fff; }
.toast--success { background: var(--color-toast-success); color: #fff; }
.toast--error   { background: var(--color-toast-error);   color: #fff; }
.toast--warning { background: var(--color-toast-warning); color: #fff; }

.toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
  word-break: break-word;
}

/* Transition classes from transitions.css */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
