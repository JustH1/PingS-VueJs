<template>
  <div class="empty-state">
    <div class="empty-state__icon">💬</div>
    <h2 class="empty-state__title">Select a conversation</h2>
    <p class="empty-state__hint">Choose a chat from the list or start a new one</p>
  </div>
</template>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--color-text-muted);
  user-select: none;
}

.empty-state__icon {
  font-size: 64px;
  opacity: 0.4;
  margin-bottom: var(--space-sm);
}

.empty-state__title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
