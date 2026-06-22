import { reactive, readonly } from 'vue'

const state = reactive({
  toasts: [],
})

let nextId = 0

export function useToast() {
  function add(type, message, duration = 4000) {
    const id = ++nextId
    state.toasts.push({ id, type, message })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  function remove(id) {
    const idx = state.toasts.findIndex(t => t.id === id)
    if (idx > -1) state.toasts.splice(idx, 1)
  }

  return {
    toasts: readonly(state).toasts,
    success: (msg, dur) => add('success', msg, dur),
    error: (msg, dur) => add('error', msg, dur),
    warning: (msg, dur) => add('warning', msg, dur),
    info: (msg, dur) => add('info', msg, dur),
    remove,
  }
}
