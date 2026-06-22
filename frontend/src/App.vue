<template>
  <ErrorBoundary>
    <router-view />
    <ToastContainer />
  </ErrorBoundary>
</template>

<script setup>
import { useHead } from '@vueuse/head'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import ToastContainer from './components/common/ToastContainer.vue'

useHead({
  title: 'ZANECO Appointment System',
  meta: [
    { name: 'description', content: 'Online appointment scheduling system for ZANECO customer service offices' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
  ],
})
</script>
