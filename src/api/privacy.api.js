import axios from 'axios'

const TOKEN_KEY = 'pings_token'

function createAuthInstance(baseURL) {
  const instance = axios.create({ baseURL })
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  return instance
}

// Regular API calls go through nginx (same origin as the rest of the app)
const privacyApi = createAuthInstance(import.meta.env.VITE_API_URL)

// TLS fingerprint endpoint — direct HTTPS on :8443 (bypasses nginx to preserve ClientHello)
// Accept self-signed cert: user must open VITE_FINGERPRINT_URL/ping once in the browser
const fingerprintApi = createAuthInstance(import.meta.env.VITE_FINGERPRINT_URL)

// ── REST calls ────────────────────────────────────────────────────────────────

export function getVisibility() {
  return privacyApi.get('/api/privacy/visibility')
}

export function getIpv6() {
  return privacyApi.get('/api/privacy/ipv6')
}

export function postWebrtc(candidates) {
  return privacyApi.post('/api/privacy/webrtc', { candidates })
}

export function getFingerprint() {
  return fingerprintApi.get('/fingerprint')
}

// ── WebRTC ICE candidate gathering ───────────────────────────────────────────
//
// Browser creates an RTCPeerConnection using our own STUN server (UDP :3478).
// After gathering completes, the raw candidate strings are sent to /api/privacy/webrtc
// for server-side analysis (local IP leaks, public IP mismatch, etc.).

export function gatherIceCandidates() {
  const stunUrl = import.meta.env.VITE_STUN_URL // e.g. "stun:192.168.1.1:3478"

  return new Promise((resolve, reject) => {
    if (!window.RTCPeerConnection) {
      reject(new Error('RTCPeerConnection не поддерживается браузером'))
      return
    }

    const candidates = []
    const pc = new RTCPeerConnection({ iceServers: [{ urls: stunUrl }] })

    // A data channel is required to trigger ICE gathering
    pc.createDataChannel('privacy-probe')

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate.candidate)
      } else {
        // null candidate = gathering complete
        pc.close()
        resolve(candidates)
      }
    }

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.close()
        resolve(candidates)
      }
    }

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((err) => {
        pc.close()
        reject(err)
      })

    // Hard timeout — some browsers never fire null candidate
    setTimeout(() => {
      if (pc.signalingState !== 'closed') pc.close()
      resolve(candidates)
    }, 6000)
  })
}
