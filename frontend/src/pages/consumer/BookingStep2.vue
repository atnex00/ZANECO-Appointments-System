<template>
  <div class="container">
    <Stepper :steps="['Info', 'Concern & Office', 'Schedule', 'Review']" :currentStep="2" />
    <div class="card form-card">
      <h2>Service Concern</h2>
      <p class="text-sm text-muted mb-6">Select the primary reason for your visit today.</p>
      <div v-if="errors.general" class="alert alert-error">{{ errors.general }}</div>
      <div v-if="loading" class="loading-state text-sm text-muted">Loading options...</div>
      <form v-else @submit.prevent="handleNext">
        <div class="form-group">
          <label class="form-label">Type of Concern *</label>
          <div class="select-wrapper">
            <select v-model="concernTypeId" class="form-select" :class="{ error: errors.concernType }">
              <option value="">-- Select your concern --</option>
              <option v-for="ct in concernTypes" :key="ct.id" :value="ct.id">{{ ct.name }}</option>
            </select>
          </div>
          <span v-if="errors.concernType" class="form-error" role="alert">{{ errors.concernType }}</span>
        </div>
        <div class="p-4 bg-primary-light rounded-xl border border-primary-muted flex gap-4 items-center">
          <span class="material-symbols-outlined" style="color:var(--color-primary);font-size:2rem">timer</span>
          <div>
            <p class="font-bold" style="color:var(--color-gray-900)">Estimated Duration</p>
            <p class="text-sm text-muted">Consultation takes about 20-30 minutes per session.</p>
          </div>
        </div>
        <div class="flex gap-4 mt-8">
          <router-link to="/book" class="btn btn-secondary" style="flex:1">Back</router-link>
          <button type="submit" class="btn btn-primary" style="flex:1">Continue</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../../stores/booking'
import { consumerApi } from '../../api/consumer'
import Stepper from '../../components/common/Stepper.vue'

const router = useRouter()
const store = useBookingStore()

const concernTypes = ref([])
const offices = ref([])
const concernTypeId = ref(store.concernTypeId || '')
const officeId = ref(store.officeId || '')
const errors = ref({})
const loading = ref(true)

const fallbackConcernTypes = [
  { id: 1, name: 'Clarification of Electric Bill Charges' },
  { id: 2, name: 'Report Account Concern' },
]

onMounted(async () => {
  try {
    const [ctRes] = await Promise.all([consumerApi.getConcernTypes()])
    concernTypes.value = ctRes.data.data || []
  } catch {
    concernTypes.value = fallbackConcernTypes
  } finally {
    loading.value = false
  }
})

function handleNext() {
  const e = {}
  if (!concernTypeId.value) e.concernType = 'Please select a concern type'
  errors.value = e
  if (Object.keys(e).length > 0) return
  store.setConcernAndOffice(Number(concernTypeId.value), Number(officeId.value))
  router.push('/book/step3')
}
</script>

<style scoped>
.form-card { max-width: 560px; margin: 0 auto; }
.form-card h2 { font-size: var(--font-size-xl); }
.alert-error {
  background-color: var(--color-danger-light); color: var(--color-danger);
  padding: 0.75rem 1rem; border-radius: var(--radius-md);
  font-size: var(--font-size-sm); margin-bottom: 1rem;
}
.loading-state { text-align: center; padding: 2rem; }
</style>
