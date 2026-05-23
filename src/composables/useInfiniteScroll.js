import { onMounted, onBeforeUnmount, watch } from 'vue'

/**
 * Calls `callback` when the sentinel element enters the viewport.
 * Used for cursor-based "load older messages" pagination.
 *
 * @param {import('vue').Ref<HTMLElement|null>} sentinelRef - ref to the sentinel div at the top of the list
 * @param {Function} callback - async function to load more items
 * @param {import('vue').Ref} enabled - reactive boolean; pauses observation when false
 */
export function useInfiniteScroll(sentinelRef, callback, enabled) {
  let observer = null

  function setup() {
    if (observer) {
      observer.disconnect()
      observer = null
    }

    if (!sentinelRef.value || (enabled && !enabled.value)) return

    observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          await callback()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.value)
  }

  onMounted(setup)

  watch(
    () => sentinelRef.value,
    () => setup(),
    { flush: 'post' }
  )

  if (enabled) {
    watch(enabled, () => setup())
  }

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
