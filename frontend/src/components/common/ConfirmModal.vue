<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="onCancel" @keydown.escape="onCancel" tabindex="-1">
        <div class="modal-card" role="dialog" aria-modal="true" :aria-label="title">
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-body">{{ message }}</p>
          <div v-if="details" class="modal-details">{{ details }}</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="onCancel">{{ cancelText }}</button>
            <button class="btn" :class="confirmClass" @click="onConfirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: 'Are you sure?' },
  details: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmClass = computed(() => props.variant === 'danger' ? 'btn-danger' : 'btn-primary')

function onConfirm() { emit('confirm') }
function onCancel() { emit('cancel') }
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8000;
}
.modal-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  max-width: 420px;
  width: 90vw;
  box-shadow: var(--shadow-lg);
}
.modal-title { font-size: var(--font-size-lg); margin-bottom: 0.5rem; }
.modal-body { font-size: var(--font-size-sm); color: var(--color-gray-600); }
.modal-details {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-gray-50);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  justify-content: flex-end;
}
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.95); }
</style>
