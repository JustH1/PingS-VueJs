<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { usePrivacyStore } from '@/stores/privacy.store'
import PrivacyBotMessage from './PrivacyBotMessage.vue'

const store = usePrivacyStore()
const messagesEl = ref(null)

// Scroll to bottom whenever messages change
watch(
  () => store.messages.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  },
)

// Also scroll when a loading message turns into a result
watch(
  () => store.messages.map((m) => m.isLoading).join(','),
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  },
)

const COMMANDS = [
  { type: 'visibility',  label: '👁️ Видимость',  title: 'Что сервер знает об IP и браузере' },
  { type: 'webrtc',      label: '📡 WebRTC',       title: 'Утечка реального IP через браузер' },
  { type: 'ipv6',        label: '🌐 IPv6',         title: 'Раскрыт ли IPv6-адрес' },
  { type: 'fingerprint', label: '🔐 TLS',          title: 'JA3 отпечаток TLS-соединения' },
]
</script>

<template>
  <div class="bot">
    <!-- ── Header ─────────────────────────────────────────── -->
    <div class="bot__header">
      <div class="bot__header-avatar">🔍</div>
      <div class="bot__header-info">
        <div class="bot__header-name">Privacy Mirror</div>
        <div class="bot__header-status">Анализирует твои данные</div>
      </div>
      <div class="bot__header-badge">BOT</div>
    </div>

    <!-- ── Messages ───────────────────────────────────────── -->
    <div class="bot__messages" ref="messagesEl">
      <PrivacyBotMessage
        v-for="msg in store.messages"
        :key="msg.id"
        :message="msg"
      />
    </div>

    <!-- ── Command bar ────────────────────────────────────── -->
    <div class="bot__commands">
      <button
        v-for="cmd in COMMANDS"
        :key="cmd.type"
        class="bot__cmd"
        :class="{ 'bot__cmd--disabled': store.isAnyLoading }"
        :disabled="store.isAnyLoading"
        :title="cmd.title"
        @click="store.runCommand(cmd.type)"
      >
        {{ cmd.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bot {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.bot__header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.bot__header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.bot__header-info {
  flex: 1;
  min-width: 0;
}

.bot__header-name {
  font-weight: 700;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.bot__header-status {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.bot__header-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--color-accent);
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

/* ── Messages ───────────────────────────────────────────────────────────── */
.bot__messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}

.bot__messages::-webkit-scrollbar { width: 4px; }
.bot__messages::-webkit-scrollbar-track { background: transparent; }
.bot__messages::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

/* ── Command bar ────────────────────────────────────────────────────────── */
.bot__commands {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.bot__cmd {
  flex: 1;
  min-width: 100px;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}

.bot__cmd:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.bot__cmd--disabled,
.bot__cmd:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .bot__cmd { font-size: var(--font-size-xs); padding: var(--space-xs) var(--space-sm); }
}
</style>
