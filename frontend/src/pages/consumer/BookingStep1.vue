<template>
  <div class="container">
    <Stepper :steps="['Info', 'Concern & Office', 'Schedule', 'Review']" :currentStep="1" />
    <div class="card form-card">
      <h2>Personal Information</h2>
      <p class="text-sm text-muted mb-6">Please provide your details below</p>
      <form @submit.prevent="handleNext" autocomplete="off">
        <div class="form-group">
          <label class="form-label" for="f-name">Full Name (as on ID) *</label>
          <input id="f-name" v-model="form.consumerName" class="form-input" :class="{ error: errors.consumerName }" placeholder="Juan Dela Cruz" autocomplete="name" aria-required="true" />
          <span v-if="errors.consumerName" class="form-error" role="alert">{{ errors.consumerName }}</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="f-account-name">Name on Electric Account *</label>
          <input id="f-account-name" v-model="form.accountName" class="form-input" :class="{ error: errors.accountName }" placeholder="Juan Dela Cruz" autocomplete="off" aria-required="true" />
          <span v-if="errors.accountName" class="form-error" role="alert">{{ errors.accountName }}</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="f-account-no">Account Number *</label>
          <input id="f-account-no" v-model="form.accountNumber" class="form-input" :class="{ error: errors.accountNumber }" placeholder="12345678" maxlength="8" inputmode="numeric" autocomplete="off" aria-required="true" />
          <span v-if="errors.accountNumber" class="form-error" role="alert">{{ errors.accountNumber }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="f-email">Email Address (optional)</label>
          <input id="f-email" v-model="form.email" class="form-input" :class="{ error: errors.email }" placeholder="juan@example.com" type="email" autocomplete="email" />
          <span v-if="errors.email" class="form-error" role="alert">{{ errors.email }}</span>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width:100%">
          Next: Select Concern & Office
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../../stores/booking'
import { required, email, accountNumber } from '../../utils/validators'
import Stepper from '../../components/common/Stepper.vue'

const router = useRouter()
const store = useBookingStore()
const errors = ref({})

const form = reactive({
  consumerName: store.consumerName,
  accountName: store.accountName,
  accountNumber: store.accountNumber,
  email: store.email,
})

function validateForm() {
  const e = {}
  if (required(form.consumerName)) e.consumerName = required(form.consumerName)
  if (required(form.accountName)) e.accountName = required(form.accountName)
  if (required(form.accountNumber)) e.accountNumber = required(form.accountNumber)
  if (form.accountNumber && accountNumber(form.accountNumber)) e.accountNumber = accountNumber(form.accountNumber)
  if (form.email && email(form.email)) e.email = email(form.email)
  return e
}

function handleNext() {
  const e = validateForm()
  errors.value = e
  if (Object.keys(e).length > 0) return
  store.setPersonalInfo({
    consumerName: form.consumerName,
    accountName: form.accountName,
    accountNumber: form.accountNumber,
    email: form.email,
  })
  router.push('/book/step2')
}
</script>

<style scoped>
.form-card {
  max-width: 560px;
  margin: 0 auto;
}
.form-card h2 {
  font-size: var(--font-size-xl);
  margin-bottom: 0.25rem;
}
</style>
