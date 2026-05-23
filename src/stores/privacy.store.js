import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as privacyApi from '@/api/privacy.api'

const COMMANDS = {
  visibility:  { label: '👁️ Проверить видимость',  emoji: '👁️' },
  webrtc:      { label: '📡 WebRTC утечки',         emoji: '📡' },
  ipv6:        { label: '🌐 IPv6 утечка',           emoji: '🌐' },
  fingerprint: { label: '🔐 TLS отпечаток',         emoji: '🔐' },
}

let _nextId = 0
function nextId() { return _nextId++ }

export const usePrivacyStore = defineStore('privacy', () => {
  // Whether the bot panel is shown instead of regular ChatPanel
  const isBotOpen = ref(false)

  // In-memory message history (not persisted — resets on page reload)
  const messages = ref([])

  // True while any bot message is being fetched
  const isAnyLoading = computed(() => messages.value.some((m) => m.isLoading))

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  function openBot() {
    isBotOpen.value = true
    if (messages.value.length === 0) {
      _pushBotMessage('welcome', null)
    }
  }

  function closeBot() {
    isBotOpen.value = false
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  async function runCommand(type) {
    if (isAnyLoading.value) return

    // Show the user's "message" (the button they pressed)
    messages.value.push({
      id:          nextId(),
      type:        'user',
      commandType: null,
      content:     COMMANDS[type].label,
      data:        null,
      isLoading:   false,
      isError:     false,
      timestamp:   new Date(),
    })

    // Add a loading bot placeholder
    const botId = nextId()
    messages.value.push({
      id:          botId,
      type:        'bot',
      commandType: type,
      content:     null,
      data:        null,
      isLoading:   true,
      isError:     false,
      timestamp:   new Date(),
    })

    try {
      const data = await _fetchData(type)
      _updateBotMessage(botId, data, false)
    } catch (err) {
      _updateBotMessage(botId, { error: err.message ?? 'Неизвестная ошибка' }, true)
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _pushBotMessage(commandType, data) {
    messages.value.push({
      id:          nextId(),
      type:        'bot',
      commandType,
      content:     null,
      data,
      isLoading:   false,
      isError:     false,
      timestamp:   new Date(),
    })
  }

  function _updateBotMessage(id, data, isError) {
    const idx = messages.value.findIndex((m) => m.id === id)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], data, isLoading: false, isError }
    }
  }

  async function _fetchData(type) {
    switch (type) {
      case 'visibility': {
        const res = await privacyApi.getVisibility()
        return res.data
      }
      case 'webrtc': {
        const candidates = await privacyApi.gatherIceCandidates()
        const res = await privacyApi.postWebrtc(candidates)
        return { ...res.data, candidatesCollected: candidates.length }
      }
      case 'ipv6': {
        const res = await privacyApi.getIpv6()
        return res.data
      }
      case 'fingerprint': {
        const res = await privacyApi.getFingerprint()
        return res.data
      }
      default:
        throw new Error(`Unknown command: ${type}`)
    }
  }

  return {
    isBotOpen,
    messages,
    isAnyLoading,
    openBot,
    closeBot,
    runCommand,
  }
})
