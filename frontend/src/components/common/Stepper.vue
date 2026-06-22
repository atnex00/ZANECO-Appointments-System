<template>
  <div class="stepper">
    <div class="stepper-track">
      <div class="stepper-progress" :style="{ width: progressWidth }"></div>
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="stepper-item"
        :class="{ active: currentStep === idx + 1, completed: currentStep > idx + 1 }"
      >
        <div class="step-circle">
          <span v-if="currentStep > idx + 1" class="material-symbols-outlined step-check">check</span>
          <span v-else class="step-num">{{ idx + 1 }}</span>
        </div>
        <span class="step-label">{{ step }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  steps: { type: Array, required: true },
  currentStep: { type: Number, default: 1 },
})

const progressWidth = computed(() => {
  const total = props.steps.length
  if (total <= 1) return '0%'
  return ((props.currentStep - 1) / (total - 1)) * 100 + '%'
})
</script>

<style scoped>
.stepper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto 2.5rem;
}
.stepper-track {
  position: relative;
  display: flex;
  justify-content: space-between;
}
.stepper-progress {
  position: absolute;
  top: 50%;
  left: 0;
  height: 3px;
  background-color: var(--color-primary);
  transform: translateY(-50%);
  transition: width 0.4s ease;
  z-index: 1;
  border-radius: 2px;
}
.stepper-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--color-gray-200);
  transform: translateY(-50%);
  z-index: 0;
  border-radius: 2px;
}
.stepper-item {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-bg);
  padding: 0 0.5rem;
}
.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  border: 2px solid var(--color-gray-300);
  color: var(--color-gray-500);
  background-color: var(--color-white);
  transition: all 0.3s ease;
}
.stepper-item.active .step-circle {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.2);
}
.stepper-item.completed .step-circle {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}
.step-check {
  font-size: 1.25rem;
  font-variation-settings: 'FILL' 1;
}
.step-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  white-space: nowrap;
  font-weight: 500;
}
.stepper-item.active .step-label {
  color: var(--color-primary);
  font-weight: 700;
}
.stepper-item.completed .step-label {
  color: var(--color-success);
}
@media (max-width: 768px) {
  .step-label { display: none; }
  .step-circle { width: 34px; height: 34px; font-size: var(--font-size-xs); }
}
</style>
