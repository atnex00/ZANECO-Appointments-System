<template>
  <div class="flex flex-col min-h-screen">
    <header class="book-header">
      <div class="book-header-inner">
        <router-link to="/" class="book-logo">
          <img src="/ZANECO_Logo.png" alt="ZANECO" class="logo-img" />
          <img src="https://i.imgur.com/SacrqEj.png" alt="DPC" class="logo-img" />
        </router-link>
        <div class="book-header-right">
          <router-link to="/view" class="book-my-btn">
            <span class="material-symbols-outlined">event_available</span>
            <span class="hide-mobile">My Appointments</span>
          </router-link>
          <div class="header-divider"></div>
          <router-link to="/book" class="btn btn-primary btn-sm">Book New</router-link>
        </div>
      </div>
    </header>

    <main class="book-main">
      <div class="book-container">
        <!-- Stepper -->
        <div class="stepper-wrapper">
          <div class="stepper-track">
            <div class="stepper-bg-line"></div>
            <div class="stepper-fill-line" :style="{ width: progressLineWidth + '%' }"></div>
            <div v-for="(s, i) in stepLabels" :key="i" class="stepper-dot-wrap" :class="{ active: currentStep === i + 1, completed: currentStep > i + 1 }">
              <div class="stepper-dot">
                <span v-if="currentStep > i + 1" class="material-symbols-outlined" style="font-size:1.25rem">check</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="stepper-dot-label hide-mobile">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="card wizard-card" style="text-align:center;padding:3rem 1.5rem">
          <p class="text-muted">Loading...</p>
        </div>
        <div v-else-if="loadError" class="card wizard-card" style="text-align:center;padding:3rem 1.5rem">
          <p class="alert alert-error">{{ loadError }}</p>
        </div>

        <!-- Wizard Card -->
        <div v-else class="wizard-card">
          <div class="wizard-header">
            <div>
              <h2 class="wizard-title">{{ stepContent[currentStep].title }}</h2>
              <p class="wizard-desc">{{ stepContent[currentStep].desc }}</p>
            </div>
            <div class="wizard-progress hide-mobile">
              <p class="progress-label">Progress</p>
              <p class="progress-pct">{{ progressPercent }}%</p>
            </div>
          </div>

          <div class="wizard-body">
            <Transition name="step-fade" mode="out-in">
              <!-- Step 1: Consumer Info -->
              <div v-if="currentStep === 1" key="step1" class="step-panel">
              <div class="form-grid-2">
                <div class="form-group" style="grid-column:1/-1">
                  <label class="form-label">Full Name</label>
                  <input v-model="form.fullName" class="form-input" placeholder="Juan Dela Cruz" autocomplete="name" aria-required="true" />
                  <span v-if="errors.fullName" class="form-error" role="alert">{{ errors.fullName }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Account Name</label>
                  <input v-model="form.accountName" class="form-input" placeholder="Juan Dela Cruz" aria-required="true" />
                  <span v-if="errors.accountName" class="form-error" role="alert">{{ errors.accountName }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Account Number</label>
                  <input v-model="form.accountNumber" class="form-input" placeholder="1000293481" maxlength="8" inputmode="numeric" aria-required="true" />
                  <span v-if="errors.accountNumber" class="form-error" role="alert">{{ errors.accountNumber }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input v-model="form.email" class="form-input" placeholder="juan@example.com" type="email" autocomplete="email" />
                </div>
              </div>
            </div>

            <!-- Step 2: Concern -->
            <div v-else-if="currentStep === 2" key="step2" class="step-panel">
              <div class="form-group">
                <label class="form-label">What is the primary reason for your visit?</label>
                <select v-model="form.concernId" class="form-select">
                  <option value="">-- Select your concern --</option>
                  <option v-for="ct in concernTypes" :key="ct.id" :value="ct.id">{{ ct.name }}</option>
                </select>
                <span v-if="errors.concernId" class="form-error" role="alert">{{ errors.concernId }}</span>
              </div>
              <div class="duration-card">
                <span class="material-symbols-outlined" style="color:var(--color-primary);font-size:2rem">timer</span>
                <div>
                  <p class="font-bold" style="color:var(--color-gray-900)">Estimated Duration</p>
                  <p class="text-sm text-muted">Consultation takes about 20-30 minutes per session.</p>
                </div>
              </div>
            </div>

            <!-- Step 3: Office Selection -->
            <div v-else-if="currentStep === 3" key="step3" class="step-panel">
              <div class="office-radio-group">
                <label v-for="office in offices" :key="office.id" class="office-radio" :class="{ 'office-radio-checked': form.officeId === office.id }">
                  <input type="radio" name="office" :value="office.id" v-model="form.officeId" class="sr-only" />
                  <div class="office-radio-inner">
                    <div class="office-radio-left">
                      <div class="office-radio-icon">
                        <span class="material-symbols-outlined">location_on</span>
                      </div>
                      <div>
                        <p class="office-radio-name">{{ office.name }}</p>
                        <p class="office-radio-addr">{{ office.address }}</p>
                      </div>
                    </div>
                    <span class="slot-badge">Available</span>
                  </div>
                </label>
              </div>
              <span v-if="errors.officeId" class="form-error" role="alert">{{ errors.officeId }}</span>
            </div>

            <!-- Step 4: Schedule -->
            <div v-else-if="currentStep === 4" key="step4" class="step-panel">
              <div class="calendar-card">
                <div class="calendar-header">
                  <button class="cal-nav-btn" type="button" @click="changeMonth(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
                  <span class="cal-month-label">{{ currentMonthLabel }}</span>
                  <button class="cal-nav-btn" type="button" @click="changeMonth(1)"><span class="material-symbols-outlined">chevron_right</span></button>
                </div>
                <div class="cal-grid">
                  <span v-for="d in dayHeaders" :key="d" class="cal-day-header">{{ d }}</span>
                  <div v-for="(cell, i) in calendarDays" :key="i"
                    class="cal-cell"
                    :class="{
                      'cal-cell-empty': !cell,
                      'cal-cell-disabled': cell?.isPast || cell?.isWeekend,
                      'cal-cell-selected': cell?.date === form.appointmentDate,
                      'cal-cell-today': cell?.isToday
                    }"
                    @click="cell && !cell.isPast && !cell.isWeekend && selectDate(cell.date)"
                  >
                    <span>{{ cell?.day || '' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="form.appointmentDate" class="timeslot-section">
                <label class="form-label">Available Time Slots</label>
                <div v-if="slotsLoading" class="text-sm text-muted">Loading...</div>
                <div v-else-if="errors._slots" class="alert alert-error" style="margin-top:0.5rem">{{ errors._slots }}</div>
                <div v-else-if="slots.length === 0" class="text-sm text-muted" style="padding:0.5rem 0">No available slots for this date.</div>
                <div v-else class="timeslot-grid">
                  <button v-for="slot in slots" :key="slot.start_time"
                    type="button"
                    class="timeslot-btn"
                    :class="{ 'timeslot-active': form.startTime === slot.start_time, 'timeslot-disabled': !slot.available }"
                    :disabled="!slot.available"
                    @click="form.startTime = slot.start_time"
                  >{{ formatTime(slot.start_time) }}</button>
                </div>
                <span v-if="errors.startTime" class="form-error" role="alert">{{ errors.startTime }}</span>
              </div>
            </div>

            <!-- Step 5: Review -->
            <div v-else key="step5" class="step-panel">
              <div class="review-card">
                <div class="review-card-header">
                  <span class="material-symbols-outlined" style="color:var(--color-primary)">assignment_turned_in</span>
                  <span class="font-bold">Appointment Summary</span>
                </div>
                <div class="zebra-stripes">
                  <div class="review-row"><span class="review-label">Consumer</span><span class="font-bold">{{ form.fullName }}</span></div>
                  <div class="review-row"><span class="review-label">Account No.</span><span>{{ form.accountNumber }}</span></div>
                  <div class="review-row"><span class="review-label">Concern</span><span>{{ selectedConcernName }}</span></div>
                  <div class="review-row"><span class="review-label">Location</span><span>{{ selectedOfficeName }}</span></div>
                  <div class="review-row">
                    <span class="review-label">Schedule</span>
                    <div style="text-align:right">
                      <p class="font-bold">{{ formatDate(form.appointmentDate) }}</p>
                      <p style="color:var(--color-primary);font-weight:600;font-size:var(--font-size-sm)">{{ formatTime(form.startTime) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="consent-box">
                <input type="checkbox" id="consent" v-model="form.consent" class="consent-checkbox" />
                <label for="consent" class="consent-label">I agree to receive notifications and acknowledge the data privacy policy of ZANECO.</label>
              </div>
              <span v-if="errors.consent" class="form-error" role="alert">{{ errors.consent }}</span>
            </div>
            </Transition>
          </div>

          <div v-if="errors._submit" class="submit-error" role="alert">
            <span class="material-symbols-outlined" style="font-size:1.25rem">error</span>
            {{ errors._submit }}
          </div>
          <!-- Footer -->
          <div class="wizard-footer">
            <button v-if="currentStep > 1" type="button" class="wizard-back-btn" @click="prevStep">
              <span class="material-symbols-outlined">arrow_back</span>
              Back
            </button>
            <div v-else></div>
            <button v-if="currentStep < 5" type="button" class="wizard-next-btn" @click="nextStep">
              Continue
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
            <button v-else type="button" class="wizard-submit-btn" @click="submitBooking" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Confirm Booking' }}
              <span class="material-symbols-outlined">check_circle</span>
            </button>
          </div>
        </div>

        <p class="help-text">Need help? <a href="https://zaneco.ph/contact-us/" target="_blank" rel="noopener" style="color:var(--color-primary);font-weight:700">Contact Customer Support</a></p>
      </div>
    </main>

    <footer class="book-footer">
      <div class="book-footer-inner">
        <div class="footer-links">
          <a href="https://zaneco.ph/contact-us/" target="_blank" rel="noopener">Support</a>
          <a href="https://zaneco.ph/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a>
          <a href="https://zaneco.ph" target="_blank" rel="noopener">Office Locations</a>
        </div>
        <p class="text-xs text-muted">&copy; {{ new Date().getFullYear() }} ZANECO. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../../stores/booking'
import { consumerApi } from '../../api/consumer'
import { format } from 'date-fns'
import { formatDate, formatTime } from '../../utils/formatters'

const router = useRouter()
const store = useBookingStore()

// --- Step config ---
const currentStep = ref(store.step || 1)
const stepLabels = ['Info', 'Concern', 'Location', 'Schedule', 'Review']
const stepContent = {
  1: { title: 'Consumer Information', desc: 'Please provide details for verification.' },
  2: { title: 'Service Concern', desc: 'Select the primary reason for your visit today.' },
  3: { title: 'Choose Location', desc: 'Select the service center most convenient for you.' },
  4: { title: 'Appointment Schedule', desc: 'Select your preferred date and time slot.' },
  5: { title: 'Final Review', desc: 'Review your details before confirming the booking.' },
}

const progressLineWidth = computed(() => ((currentStep.value - 1) / (stepLabels.length - 1)) * 100)
const progressPercent = computed(() => Math.round((currentStep.value / stepLabels.length) * 100))

// --- Form state ---
const form = reactive({
  fullName: store.consumerName || '',
  accountName: store.accountName || '',
  accountNumber: store.accountNumber || '',
  email: store.email || '',
  concernId: store.concernTypeId || '',
  officeId: store.officeId || '',
  appointmentDate: store.appointmentDate || '',
  startTime: store.startTime || '',
  consent: false,
})

const errors = ref({})
const submitting = ref(false)

// --- Data ---
const concernTypes = ref([])
const offices = ref([])
const slots = ref([])
const slotsLoading = ref(false)
const scheduleMap = ref({})
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  if (store.referenceNumber) store.reset()
  currentStep.value = 1
  try {
    const [ctRes, offRes] = await Promise.all([consumerApi.getConcernTypes(), consumerApi.getOffices()])
    concernTypes.value = ctRes.data.data || []
    offices.value = offRes.data.data || []
  } catch (err) {
    console.error('Failed to load initial data:', err)
    loadError.value = 'Failed to load data. Please refresh the page and try again.'
  } finally {
    loading.value = false
  }
})

const selectedConcernName = computed(() => {
  const c = concernTypes.value.find(x => x.id === form.concernId)
  return c?.name || ''
})
const selectedOfficeName = computed(() => {
  const o = offices.value.find(x => x.id === form.officeId)
  return o?.name || ''
})

// --- Validation ---
watch(currentStep, async (step) => {
  if (step === 4 && form.officeId && Object.keys(scheduleMap.value).length === 0) {
    try {
      const { data } = await consumerApi.getOfficeSchedule(form.officeId)
      const map = {}
      if (data.data) {
        for (const s of data.data) {
          map[s.dayOfWeek] = s
        }
      }
      scheduleMap.value = map
    } catch {
      // Default to blocking weekends if schedule fails
    }
  }
})
function validateStep(step) {
  const e = {}
  if (step === 1) {
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.accountName.trim()) e.accountName = 'Required'
    if (!form.accountNumber.trim()) e.accountNumber = 'Required'
    else if (!/^\d{8}$/.test(form.accountNumber.trim())) e.accountNumber = 'Please enter exactly 8 digits'
  }
  if (step === 2) { if (!form.concernId) e.concernId = 'Please select a concern' }
  if (step === 3) { if (!form.officeId) e.officeId = 'Please select an office' }
  if (step === 4) { if (!form.appointmentDate) e.appointmentDate = 'Select a date'; else if (!form.startTime) e.startTime = 'Select a time' }
  if (step === 5) { if (!form.consent) e.consent = 'You must agree to continue' }
  errors.value = e
  return Object.keys(e).length === 0
}

function nextStep() {
  if (!validateStep(currentStep.value)) return
  currentStep.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prevStep() {
  if (currentStep.value <= 1) return
  currentStep.value--
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// --- Calendar ---
const now = new Date()
const currentMonth = ref(now.getMonth())
const currentYear = ref(now.getFullYear())
const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const currentMonthLabel = computed(() => format(new Date(currentYear.value, currentMonth.value), 'MMMM yyyy'))

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear.value, currentMonth.value, d)
    const dayName = dayNames[dateObj.getDay()]
    const scheduleDay = scheduleMap.value[dayName]
    const isNonWorking = scheduleDay ? !scheduleDay.isWorkingDay : dateObj.getDay() === 0 || dateObj.getDay() === 6
    days.push({
      day: d,
      date: format(dateObj, 'yyyy-MM-dd'),
      isPast: dateObj < today,
      isWeekend: isNonWorking,
      isToday: dateObj.getTime() === today.getTime(),
    })
  }
  return days
})

function changeMonth(delta) {
  currentMonth.value += delta
  if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- }
  if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ }
}

// --- Time slots ---
async function selectDate(date) {
  form.appointmentDate = date
  form.startTime = ''
  slotsLoading.value = true
  try {
    const { data } = await consumerApi.getTimeSlots(form.officeId, date)
    slots.value = data.data.slots
  } catch (err) {
    console.error('Failed to load slots:', err)
    slots.value = []
    errors.value = { ...errors.value, _slots: 'Failed to load available slots. Please try again or check your connection.' }
  }
  finally { slotsLoading.value = false }
}

// --- Submit ---
async function submitBooking() {
  if (!validateStep(5)) return
  submitting.value = true
  try {
    store.setPersonalInfo({ consumerName: form.fullName, accountName: form.accountName, accountNumber: form.accountNumber, email: form.email })
    store.setConcernAndOffice(Number(form.concernId), Number(form.officeId))
    store.setDateTime(form.appointmentDate, form.startTime)
    await store.submitBooking()
    router.push('/book/confirm')
  } catch (e) {
    const msg = store.error || 'Booking failed. Please try again or contact support.'
    errors.value = { _submit: msg }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  finally { submitting.value = false }
}
</script>

<style scoped>
.book-header {
  background-color: var(--color-white);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 50;
}
.book-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
}
.book-logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
.logo-img { height: 2rem; width: auto; }
.book-header-right { display: flex; align-items: center; gap: 0.75rem; }
.book-my-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); color: var(--color-gray-600); text-decoration: none; font-size: var(--font-size-sm); font-weight: 500; }
.book-my-btn:hover { background-color: var(--color-gray-100); }
.header-divider { width: 1px; height: 24px; background-color: var(--color-gray-200); }

.book-main { flex: 1; padding: 2.5rem 1rem; }
.book-container { max-width: 640px; margin: 0 auto; }

/* Stepper */
.stepper-wrapper { margin-bottom: 2.5rem; }
.stepper-track { position: relative; display: flex; justify-content: space-between; }
.stepper-bg-line { position: absolute; top: 50%; left: 0; right: 0; height: 3px; background: var(--color-gray-200); transform: translateY(-50%); border-radius: 2px; }
.stepper-fill-line { position: absolute; top: 50%; left: 0; height: 3px; background: var(--color-primary); transform: translateY(-50%); transition: width 0.4s ease; border-radius: 2px; }
.stepper-dot-wrap { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background-color: var(--color-bg); padding: 0 0.5rem; }
.stepper-dot {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-sm); font-weight: 700;
  border: 2px solid var(--color-gray-300);
  color: var(--color-gray-500);
  background-color: var(--color-white);
  transition: all 0.3s ease;
}
.stepper-dot-wrap.active .stepper-dot { background-color: var(--color-primary); border-color: var(--color-primary); color: var(--color-white); box-shadow: 0 0 0 4px rgba(217,119,6,0.2); }
.stepper-dot-wrap.completed .stepper-dot { background-color: var(--color-success); border-color: var(--color-success); color: var(--color-white); }
.stepper-dot-label { font-size: var(--font-size-xs); font-weight: 500; color: var(--color-gray-500); }
.stepper-dot-wrap.active .stepper-dot-label { color: var(--color-primary); font-weight: 700; }
.stepper-dot-wrap.completed .stepper-dot-label { color: var(--color-success); }

/* Wizard Card */
.wizard-card { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-md); }
.wizard-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: flex-start; background-color: var(--color-bg); }
.wizard-title { font-size: 1.375rem; font-weight: 700; color: var(--color-gray-900); }
.wizard-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 0.25rem; }
.wizard-progress { text-align: right; }
.progress-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.progress-pct { font-size: 1.5rem; font-weight: 700; color: var(--color-primary); }

.wizard-body { padding: 2rem; min-height: 300px; }

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.duration-card {
  margin-top: 1rem; padding: 1rem;
  background-color: var(--color-primary-light);
  border: 1px solid var(--color-primary-muted);
  border-radius: var(--radius-xl);
  display: flex; gap: 1rem; align-items: center;
}

/* Office Radio Cards */
.office-radio-group { display: flex; flex-direction: column; gap: 0.75rem; }
.office-radio { cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.office-radio-inner {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  transition: all 0.15s;
}
.office-radio:hover .office-radio-inner { background-color: var(--color-gray-50); }
.office-radio-checked .office-radio-inner { border-color: var(--color-primary); background-color: var(--color-primary-light); box-shadow: 0 0 0 1px var(--color-primary); }
.office-radio-left { display: flex; align-items: center; gap: 0.75rem; }
.office-radio-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background-color: var(--color-gray-100);
  display: flex; align-items: center; justify-content: center;
}
.office-radio-checked .office-radio-icon { background-color: var(--color-primary-muted); }
.office-radio-icon .material-symbols-outlined { font-size: 1.25rem; color: var(--color-primary); }
.office-radio-name { font-weight: 700; font-size: var(--font-size-sm); }
.office-radio-addr { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.slot-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 0.25rem 0.625rem; border-radius: 9999px; background-color: var(--color-success-light); color: var(--color-success); }

/* Calendar */
.calendar-card { background-color: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.25rem; margin-bottom: 1rem; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.cal-nav-btn { background: none; border: none; padding: 0.25rem; border-radius: var(--radius-sm); color: var(--color-gray-600); cursor: pointer; }
.cal-nav-btn:hover { background-color: var(--color-gray-100); }
.cal-nav-btn .material-symbols-outlined { font-size: 1.25rem; }
.cal-month-label { font-weight: 700; font-size: var(--font-size-sm); color: var(--color-text); }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-day-header { text-align: center; font-size: 10px; font-weight: 700; color: var(--color-text-muted); padding: 0.375rem 0; }
.cal-cell { text-align: center; padding: 0.5rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); cursor: pointer; transition: background-color 0.1s; }
.cal-cell:hover:not(.cal-cell-empty):not(.cal-cell-disabled) { background-color: var(--color-primary-light); }
.cal-cell-empty { cursor: default; }
.cal-cell-disabled { color: var(--color-gray-300); cursor: not-allowed; }
.cal-cell-today { font-weight: 700; }
.cal-cell-selected { background-color: var(--color-primary) !important; color: var(--color-white) !important; font-weight: 700; border-radius: var(--radius-md); }

.timeslot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.timeslot-btn { padding: 0.5rem; border: 1px solid var(--color-gray-300); border-radius: var(--radius-lg); background: var(--color-white); font-size: var(--font-size-sm); cursor: pointer; text-align: center; transition: all 0.15s; }
.timeslot-btn:hover:not(:disabled) { border-color: var(--color-primary); background-color: var(--color-primary-light); }
.timeslot-active { border-color: var(--color-primary); background-color: var(--color-primary); color: var(--color-white); }
.timeslot-disabled { opacity: 0.4; cursor: not-allowed; }

/* Review */
.review-card { border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }
.review-card-header { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 0.5rem; font-size: var(--font-size-sm); }
.review-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; font-size: var(--font-size-sm); border-bottom: 1px solid var(--color-border); }
.review-row:last-child { border-bottom: none; }
.review-label { color: var(--color-text-muted); font-weight: 600; }

.consent-box { display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1rem; padding: 1rem; background-color: var(--color-gray-50); border-radius: var(--radius-xl); }
.consent-checkbox { margin-top: 0.125rem; width: 20px; height: 20px; accent-color: var(--color-primary); cursor: pointer; }
.consent-label { font-size: var(--font-size-sm); color: var(--color-gray-600); cursor: pointer; }

/* Submit error */
.submit-error { display: flex; align-items: center; gap: 0.5rem; margin: 0 2rem; padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); color: #dc2626; font-size: var(--font-size-sm); font-weight: 600; }

/* Footer */
.wizard-footer { padding: 1rem 2rem; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.wizard-back-btn { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; color: var(--color-gray-500); font-weight: 700; font-size: var(--font-size-sm); cursor: pointer; }
.wizard-back-btn:hover { color: var(--color-primary); }
.wizard-next-btn, .wizard-submit-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 2rem; border-radius: var(--radius-xl); font-weight: 700; font-size: var(--font-size-sm); cursor: pointer; border: none; transition: all 0.15s; }
.wizard-next-btn { background-color: var(--color-primary); color: var(--color-white); box-shadow: var(--shadow-md); }
.wizard-next-btn:hover { background-color: var(--color-primary-hover); transform: translateY(-1px); }
.wizard-next-btn:active { transform: translateY(0) scale(0.98); }
.wizard-submit-btn { background-color: var(--color-success); color: var(--color-white); box-shadow: var(--shadow-md); }
.wizard-submit-btn:hover { background-color: #047857; }
.wizard-submit-btn:active { transform: scale(0.98); }

.help-text { text-align: center; margin-top: 1.5rem; font-size: var(--font-size-sm); color: var(--color-text-muted); }

/* Step transitions */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.book-footer { background-color: var(--color-gray-50); border-top: 1px solid var(--color-border); padding: 1.5rem; }
.book-footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.footer-links { display: flex; gap: 1.5rem; }
.footer-links a { font-size: var(--font-size-sm); color: var(--color-text-muted); text-decoration: none; }
.footer-links a:hover { color: var(--color-primary); }

@media (max-width: 768px) {
  .hide-mobile { display: none; }
  .form-grid-2 { grid-template-columns: 1fr; }
  .timeslot-grid { grid-template-columns: repeat(2, 1fr); }
  .stepper-dot { width: 34px; height: 34px; }
  .book-footer-inner { flex-direction: column; text-align: center; }
  .wizard-body { padding: 1.25rem; }
  .wizard-header { padding: 1.25rem; }
  .wizard-footer { padding: 1rem 1.25rem; }
  .submit-error { margin: 0 1.25rem; }
}
</style>
