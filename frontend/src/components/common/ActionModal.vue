<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="modal-close" @click="$emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer">
            <slot name="footer">
              <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
              <button class="btn" :class="confirmClass" :disabled="confirmDisabled" @click="$emit('confirm')">{{ confirmText }}</button>
            </slot>
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
  title: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
  confirmText: { type: String, default: 'Confirm' },
  confirmDisabled: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])

const confirmClass = computed(() => props.variant === 'danger' ? 'btn-danger' : 'btn-primary')
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 1rem;
}
.modal-card {
  background: var(--color-white); border-radius: var(--radius-xl);
  width: 100%; max-width: 480px; box-shadow: var(--shadow-xl);
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
}
.modal-header h3 { font-size: 1.125rem; font-weight: 700; }
.modal-close {
  background: none; border: none; font-size: 1.5rem; cursor: pointer;
  color: var(--color-gray-500); padding: 0; line-height: 1;
}
.modal-body { padding: 1.25rem 1.5rem; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem; border-top: 1px solid var(--color-border);
}

.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-card { animation: modalSlideIn 0.25s cubic-bezier(0.4,0,0.2,1) both; }
.modal-leave-active .modal-card { animation: modalSlideIn 0.2s cubic-bezier(0.4,0,0.2,1) reverse both; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
