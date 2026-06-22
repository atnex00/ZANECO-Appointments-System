<template>
  <div class="spinner-overlay" v-if="visible">
    <div class="spinner"></div>
    <p v-if="message" class="spinner-text">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  message: { type: String, default: '' },
})
</script>

<style scoped>
.spinner-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner-text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}
</style>
