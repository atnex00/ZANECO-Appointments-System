<template>
  <div class="skeleton" :class="[variant, `skeleton-${shape}`]" :style="customStyle" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'text' },
  shape: { type: String, default: 'rect' },
  width: { type: String, default: '' },
  height: { type: String, default: '' },
  lines: { type: Number, default: 1 },
})

const customStyle = computed(() => {
  const s = {}
  if (props.width) s.width = props.width
  if (props.height) s.height = props.height
  return s
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, var(--color-gray-200) 25%, var(--color-gray-100) 50%, var(--color-gray-200) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
.skeleton-circle { border-radius: 50%; }
.skeleton-rect { border-radius: var(--radius-sm); }
.skeleton-text { height: 1em; width: 100%; margin-bottom: 0.5rem; }
.skeleton-card { height: 100px; width: 100%; }
.skeleton-avatar { width: 40px; height: 40px; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
