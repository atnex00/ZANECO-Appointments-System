<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-message">{{ message }}</p>
    <router-link v-if="linkTo" :to="linkTo" class="btn btn-primary btn-sm mt-4">{{ linkLabel }}</router-link>
    <button v-else-if="actionLabel" class="btn btn-primary btn-sm mt-4" @click="$emit('action')">{{ actionLabel }}</button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '\u{1F4CB}' },
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' },
  linkTo: { type: String, default: '' },
  linkLabel: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
})
defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}
.empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.empty-title { font-size: var(--font-size-lg); margin-bottom: 0.5rem; color: var(--color-gray-700); }
.empty-message { font-size: var(--font-size-sm); color: var(--color-gray-500); max-width: 320px; margin: 0 auto; }
</style>
