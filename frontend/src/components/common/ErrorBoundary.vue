<template>
  <div v-if="hasError" class="error-boundary card">
    <div class="error-icon">!</div>
    <h2>Something went wrong</h2>
    <p class="text-sm text-muted">{{ errorMessage }}</p>
    <button class="btn btn-primary mt-4" @click="reset">Try Again</button>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred.'
  return false
})

function reset() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<style scoped>
.error-boundary {
  text-align: center;
  padding: 3rem;
  max-width: 480px;
  margin: 3rem auto;
}
.error-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}
</style>
