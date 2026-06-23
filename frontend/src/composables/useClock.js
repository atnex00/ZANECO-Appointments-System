import { ref, onMounted, onUnmounted } from 'vue'

export function useClock() {
  const time = ref('')
  const date = ref('')

  let timer = null

  function update() {
    const now = new Date()
    time.value = now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    date.value = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  onMounted(() => {
    update()
    timer = setInterval(update, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { time, date }
}
