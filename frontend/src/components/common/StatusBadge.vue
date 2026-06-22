<template>
  <span class="badge" :class="`badge-${status}`">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { statusLabel } from '../../utils/formatters'

const props = defineProps({
  status: { type: String, required: true },
})
const label = computed(() => statusLabel(props.status))
</script>
