<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
})

// Exposed to template — env vars are not accessible as $env in Vue 3
const fingerprintUrl = import.meta.env.VITE_FINGERPRINT_URL ?? ''

// Format time like "14:32"
const time = computed(() => {
  const d = new Date(props.message.timestamp)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

// Severity badge colours
function severityClass(severity) {
  return severity === 'high' ? 'badge--danger' : 'badge--warn'
}
</script>

<template>
  <!-- ── User message (right-aligned) ──────────────────────── -->
  <div v-if="message.type === 'user'" class="pm pm--user">
    <div class="pm__bubble pm__bubble--user">
      <span class="pm__text">{{ message.content }}</span>
      <span class="pm__time">{{ time }}</span>
    </div>
  </div>

  <!-- ── Bot messages (left-aligned) ───────────────────────── -->
  <div v-else class="pm pm--bot">
    <div class="pm__avatar">🔍</div>

    <div class="pm__bubble pm__bubble--bot">

      <!-- Loading spinner -->
      <template v-if="message.isLoading">
        <div class="pm__loading">
          <span class="pm__dot"></span>
          <span class="pm__dot"></span>
          <span class="pm__dot"></span>
        </div>
      </template>

      <!-- Error -->
      <template v-else-if="message.isError">
        <div class="pm__error">⚠️ {{ message.data?.error ?? 'Ошибка запроса' }}</div>
      </template>

      <!-- ── Welcome ──────────────────────────────────────── -->
      <template v-else-if="message.commandType === 'welcome'">
        <p class="pm__title">Привет! Я <strong>Privacy Mirror</strong> 👀</p>
        <p class="pm__text">Нажми кнопку внизу — и я покажу, что сервер видит о тебе прямо сейчас.</p>
        <ul class="pm__list">
          <li>👁️ &nbsp;Видимость — IP, ISP, браузер, аномалии</li>
          <li>📡 &nbsp;WebRTC — утечка реального IP через браузер</li>
          <li>🌐 &nbsp;IPv6 — раскрыт ли IPv6-адрес</li>
          <li>🔐 &nbsp;TLS — отпечаток TLS-соединения (JA3)</li>
        </ul>
      </template>

      <!-- ── Visibility ───────────────────────────────────── -->
      <template v-else-if="message.commandType === 'visibility' && message.data">
        <p class="pm__title">👁️ Сервер видит</p>
        <div class="pm__section">
          <div class="pm__row"><span class="pm__label">🌍 IP</span><span class="pm__val">{{ message.data.ip }}</span></div>
          <div class="pm__row"><span class="pm__label">🏢 ISP</span><span class="pm__val">{{ message.data.isp }}</span></div>
          <div class="pm__row"><span class="pm__label">📍 Город</span><span class="pm__val">{{ message.data.city }}, {{ message.data.country }}</span></div>
          <div class="pm__row"><span class="pm__label">🔢 ASN</span><span class="pm__val">{{ message.data.asn }} {{ message.data.asn_name }}</span></div>
        </div>
        <div class="pm__section">
          <div class="pm__row">
            <span class="pm__label">🖥️ Браузер</span>
            <span class="pm__val">{{ message.data.browser }} {{ message.data.browser_version }} · {{ message.data.os }} {{ message.data.os_version }}</span>
          </div>
          <div class="pm__row"><span class="pm__label">🌐 Язык</span><span class="pm__val">{{ message.data.language || '—' }}</span></div>
          <div class="pm__row"><span class="pm__label">🕐 Таймзона</span><span class="pm__val">{{ message.data.timezone || '—' }}</span></div>
          <div class="pm__row"><span class="pm__label">🔒 DNT</span><span class="pm__val">{{ message.data.do_not_track ? 'включён' : 'выключен' }}</span></div>
        </div>
        <div class="pm__section">
          <div class="pm__row">
            <span class="pm__label">🛡️ Proxy/VPN</span>
            <span class="pm__val" :class="message.data.proxy?.proxy_detected ? 'pm__val--danger' : 'pm__val--ok'">
              {{ message.data.proxy?.proxy_detected ? '⚠️ Обнаружен' : '✅ Нет' }}
            </span>
          </div>
          <div class="pm__row">
            <span class="pm__label">🏭 Датацентр</span>
            <span class="pm__val" :class="message.data.is_datacenter ? 'pm__val--warn' : 'pm__val--ok'">
              {{ message.data.is_datacenter ? '⚠️ Да' : '✅ Нет' }}
            </span>
          </div>
        </div>
        <div class="pm__section">
          <div class="pm__row">
            <span class="pm__label">🔬 Отпечаток браузера</span>
            <span class="pm__val">{{ message.data.header_fingerprint?.browser }} ({{ message.data.header_fingerprint?.confidence }}%)</span>
          </div>
          <div class="pm__row" v-if="message.data.header_fingerprint?.spoofed">
            <span class="pm__val pm__val--danger">⚠️ UA-спуфинг обнаружен</span>
          </div>
        </div>
        <template v-if="message.data.anomalies?.length">
          <p class="pm__subtitle">⚠️ Аномалии</p>
          <div v-for="a in message.data.anomalies" :key="a.type" class="pm__anomaly">
            <span class="badge" :class="severityClass(a.severity)">{{ a.severity }}</span>
            {{ a.message }}
          </div>
        </template>
        <p v-else class="pm__ok">✅ Аномалий не обнаружено</p>
      </template>

      <!-- ── WebRTC ────────────────────────────────────────── -->
      <template v-else-if="message.commandType === 'webrtc' && message.data">
        <p class="pm__title">📡 WebRTC анализ</p>
        <div class="pm__section">
          <div class="pm__row">
            <span class="pm__label">📦 Кандидатов собрано</span>
            <span class="pm__val">{{ message.data.candidatesCollected ?? 0 }}</span>
          </div>
          <div class="pm__row">
            <span class="pm__label">🔓 Утечка локального IP</span>
            <span class="pm__val" :class="message.data.local_ip_leak ? 'pm__val--danger' : 'pm__val--ok'">
              {{ message.data.local_ip_leak ? '⚠️ Есть' : '✅ Нет' }}
            </span>
          </div>
          <div v-if="message.data.local_ip_leak && message.data.local_ips?.length" class="pm__row">
            <span class="pm__label">🏠 Локальные IP</span>
            <span class="pm__val pm__val--danger">{{ message.data.local_ips.join(', ') }}</span>
          </div>
          <div class="pm__row">
            <span class="pm__label">🌍 Утечка публичного IP</span>
            <span class="pm__val" :class="message.data.public_ip_leak ? 'pm__val--danger' : 'pm__val--ok'">
              {{ message.data.public_ip_leak ? '⚠️ Есть' : '✅ Нет' }}
            </span>
          </div>
          <div v-if="message.data.webrtc_public_ip" class="pm__row">
            <span class="pm__label">IP через WebRTC</span>
            <span class="pm__val">{{ message.data.webrtc_public_ip }}</span>
          </div>
          <div v-if="message.data.http_public_ip" class="pm__row">
            <span class="pm__label">IP через HTTP</span>
            <span class="pm__val">{{ message.data.http_public_ip }}</span>
          </div>
        </div>
        <p class="pm__note">{{ message.data.message }}</p>
      </template>

      <!-- ── IPv6 ──────────────────────────────────────────── -->
      <template v-else-if="message.commandType === 'ipv6' && message.data">
        <p class="pm__title">🌐 IPv6 утечка</p>
        <div class="pm__section">
          <div class="pm__row">
            <span class="pm__label">📌 Адрес</span>
            <span class="pm__val">{{ message.data.ip }}</span>
          </div>
          <div class="pm__row">
            <span class="pm__label">Протокол</span>
            <span class="pm__val" :class="message.data.is_ipv6 ? 'pm__val--warn' : 'pm__val--ok'">
              {{ message.data.is_ipv6 ? '⚠️ IPv6' : '✅ IPv4' }}
            </span>
          </div>
        </div>
        <p class="pm__note">{{ message.data.note }}</p>
      </template>

      <!-- ── TLS Fingerprint ───────────────────────────────── -->
      <template v-else-if="message.commandType === 'fingerprint' && message.data">
        <p class="pm__title">🔐 TLS отпечаток (JA3)</p>
        <template v-if="!message.data.available">
          <p class="pm__note pm__note--warn">
            Для получения JA3 хэша откройте
            <a :href="fingerprintUrl + '/ping'" target="_blank">{{ fingerprintUrl }}/ping</a>
            в браузере, примите самоподписанный сертификат, затем повторите.
          </p>
        </template>
        <template v-else>
          <div class="pm__section">
            <div class="pm__row">
              <span class="pm__label">🏷️ JA3 Hash</span>
              <code class="pm__code">{{ message.data.ja3_hash }}</code>
            </div>
            <div class="pm__row">
              <span class="pm__label">📋 JA3 строка</span>
              <code class="pm__code pm__code--small">{{ message.data.ja3_string }}</code>
            </div>
            <div class="pm__row">
              <span class="pm__label">🔒 Версия TLS</span>
              <span class="pm__val">{{ message.data.tls_version }}</span>
            </div>
            <div class="pm__row">
              <span class="pm__label">🌐 HTTP/2</span>
              <span class="pm__val" :class="message.data.is_http2 ? 'pm__val--ok' : ''">
                {{ message.data.is_http2 ? '✅ Да' : 'Нет' }}
              </span>
            </div>
          </div>
        </template>
      </template>

      <span class="pm__time">{{ time }}</span>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.pm {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  max-width: 100%;
}
.pm--user { flex-direction: row-reverse; }
.pm--bot  { flex-direction: row; }

/* ── Avatar ─────────────────────────────────────────────────────────────── */
.pm__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  align-self: flex-start;
}

/* ── Bubble ─────────────────────────────────────────────────────────────── */
.pm__bubble {
  position: relative;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  max-width: 520px;
  word-break: break-word;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.pm__bubble--user {
  background: var(--color-accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.pm__bubble--bot {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--color-border);
}

/* ── Content elements ───────────────────────────────────────────────────── */
.pm__title {
  font-weight: 700;
  font-size: var(--font-size-md);
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-text-primary);
}
.pm__subtitle {
  font-weight: 600;
  margin: var(--space-sm) 0 4px 0;
  color: var(--color-text-secondary);
}
.pm__text  { margin: 0 0 var(--space-xs) 0; }
.pm__note  { margin: var(--space-xs) 0 0 0; color: var(--color-text-secondary); font-style: italic; }
.pm__note--warn { color: #f0a500; font-style: normal; }
.pm__ok    { color: #4caf50; margin: var(--space-xs) 0 0 0; }
.pm__error { color: #e53935; }

.pm__list {
  margin: var(--space-xs) 0 0 0;
  padding-left: var(--space-lg);
  color: var(--color-text-secondary);
  line-height: 1.8;
}
.pm__list li { list-style: none; padding: 2px 0; }

.pm__section {
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}
.pm__section:last-of-type { border-bottom: none; }

.pm__row {
  display: flex;
  gap: var(--space-sm);
  padding: 2px 0;
  align-items: flex-start;
}
.pm__label {
  flex-shrink: 0;
  min-width: 140px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.pm__val { font-weight: 500; }
.pm__val--ok     { color: #4caf50; }
.pm__val--warn   { color: #f0a500; }
.pm__val--danger { color: #e53935; }

.pm__code {
  font-family: monospace;
  font-size: 11px;
  background: var(--color-bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
}
.pm__code--small { font-size: 10px; opacity: 0.8; }

.pm__anomaly {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: 3px 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}
.badge--danger { background: #fde8e8; color: #c62828; }
.badge--warn   { background: #fff3e0; color: #e65100; }

/* ── Timestamp ──────────────────────────────────────────────────────────── */
.pm__time {
  display: block;
  text-align: right;
  font-size: 10px;
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
  opacity: 0.7;
}
.pm__bubble--user .pm__time { color: rgba(255,255,255,0.7); }

/* ── Loading dots ───────────────────────────────────────────────────────── */
.pm__loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: var(--space-xs) 0;
}
.pm__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  animation: bounce 1.2s infinite;
}
.pm__dot:nth-child(2) { animation-delay: .2s; }
.pm__dot:nth-child(3) { animation-delay: .4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: .5; }
  40%           { transform: translateY(-5px); opacity: 1; }
}
</style>
