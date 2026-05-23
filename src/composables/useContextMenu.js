import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Manages a floating context menu (right-click or button trigger).
 * Returns reactive state and event handlers.
 */
export function useContextMenu() {
  const isOpen = ref(false)
  const position = ref({ x: 0, y: 0 })
  const targetData = ref(null)

  function open(event, data = null) {
    event.preventDefault()
    event.stopPropagation()
    targetData.value = data

    // Determine position
    const vw = window.innerWidth
    const vh = window.innerHeight
    let x = event.clientX ?? event.pageX
    let y = event.clientY ?? event.pageY

    // Keep within viewport (rough estimate: menu is ~160×100px)
    if (x + 160 > vw) x = vw - 168
    if (y + 100 > vh) y = vh - 108

    position.value = { x, y }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    targetData.value = null
  }

  function handleOutsideClick() {
    if (isOpen.value) close()
  }

  onMounted(() => window.addEventListener('click', handleOutsideClick))
  onBeforeUnmount(() => window.removeEventListener('click', handleOutsideClick))

  return { isOpen, position, targetData, open, close }
}
