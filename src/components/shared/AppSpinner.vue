<script setup>
defineProps({
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
})
</script>

<template>
  <span class="spinner" :class="`spinner--${size}`" aria-label="Loading…" />
</template>

<style scoped>
.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--color-bg-hover);
  border-top-color: var(--color-accent-light);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spinner--sm { width: 16px; height: 16px; }
.spinner--md { width: 24px; height: 24px; }
.spinner--lg { width: 36px; height: 36px; border-width: 3px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
