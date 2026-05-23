import { ref } from 'vue'

/**
 * Returns a debounced version of the provided function.
 * @param {Function} fn
 * @param {number} delay - milliseconds
 */
export function useDebounce(fn, delay = 300) {
  let timer = null

  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }

  function cancel() {
    clearTimeout(timer)
  }

  return { debounced, cancel }
}

/**
 * Reactive debounced value.
 * @param {import('vue').Ref} source
 * @param {number} delay
 */
export function useDebouncedRef(source, delay = 300) {
  const debounced = ref(source.value)
  let timer = null

  function update(val) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delay)
  }

  return { debounced, update }
}
