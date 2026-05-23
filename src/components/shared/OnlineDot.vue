<script setup>
defineProps({
  online: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
})
</script>

<template>
  <span class="online-dot" :class="[`online-dot--${size}`, { 'online-dot--active': online }]" />
</template>

<style scoped>
.online-dot {
  display: inline-block;
  border-radius: 50%;
  background-color: var(--color-offline);
  flex-shrink: 0;
  transition: background-color var(--transition-fast);
}

.online-dot--active {
  background-color: var(--color-online);
  box-shadow: 0 0 0 2px var(--color-bg-secondary);
}

.online-dot--sm {
  width: 8px;
  height: 8px;
}

.online-dot--md {
  width: 10px;
  height: 10px;
}

.online-dot--lg {
  width: 12px;
  height: 12px;
}
</style>
