<template>
  <div class="digital-clock">
    <span class="clock-time">{{ time }}</span>
    <span class="clock-date">{{ date }}</span>
  </div>
</template>

<script setup>
import { useClock } from '../../composables/useClock'

const { time, date } = useClock()
</script>

<style scoped>
.digital-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.clock-time {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

.clock-date {
  font-size: 0.688rem;
  color: #444653;
  font-weight: 500;
}
</style>
