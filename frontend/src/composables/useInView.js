import { ref, onMounted, onUnmounted } from 'vue'

export function useInView(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', delay = 0 } = options
  const el = ref(null)
  const inView = ref(false)

  let observer = null

  onMounted(() => {
    if (!el.value) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => { inView.value = true }, delay)
          if (observer) observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el.value)
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  return { el, inView }
}
