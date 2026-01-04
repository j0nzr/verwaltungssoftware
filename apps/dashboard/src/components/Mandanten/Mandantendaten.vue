<template>
  <div class="mandantendaten-form">
    <h2>{{ isEditMode ? 'Mandantendaten bearbeiten' : 'Neuer Mandant' }}</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <h3>Allgemeine Informationen</h3>

        <div class="form-group">
          <label for="name">Mandant-Name</label>
          <input
            id="name"
            v-model="formData.mandantName"
            type="text"
            required
            placeholder="Name des Mandanten"
          />
        </div>

        <div class="form-group">
          <label for="zusatz">Zusatz</label>
          <input
            id="zusatz"
            v-model="formData.zusatz"
            type="text"
            placeholder="z.B. Wohnungseigentümergemeinschaft"
          />
        </div>
      </div>

      <div class="form-section">
        <h3>Adresse</h3>

        <div class="form-group">
          <label for="adresse1">Adresszeile 1</label>
          <input
            id="adresse1"
            v-model="formData.adresszeile1"
            type="text"
            placeholder="Straße und Hausnummer"
          />
        </div>

        <div class="form-group">
          <label for="adresse2">Adresszeile 2</label>
          <input
            id="adresse2"
            v-model="formData.adresszeile2"
            type="text"
            placeholder="Zusätzliche Adressinformationen"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="plz">PLZ</label>
            <input
              id="plz"
              v-model="formData.plz"
              type="text"
              required
              placeholder="Postleitzahl"
            />
          </div>

          <div class="form-group">
            <label for="ort">Ort</label>
            <input
              id="ort"
              v-model="formData.ort"
              type="text"
              required
              placeholder="Stadt"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Verwaltungsinformationen</h3>

        <div class="form-group">
          <label for="verwaltungsart">Verwaltungsart</label>
          <select
            id="verwaltungsart"
            v-model="formData.verwaltungsart"
            required
          >
            <option value="">Bitte wählen...</option>
            <option value="WEG">WEG</option>
            <option value="Mietverwaltung">Mietverwaltung</option>
            <option value="Sondereigentum">Sondereigentum</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="wirtschaftsjahr-beginn">Wirtschaftsjahr Beginn</label>
            <input
              id="wirtschaftsjahr-beginn"
              v-model="formData.wirtschaftsjahrBeginn"
              type="text"
              required
              placeholder="dd.mm"
              pattern="\d{2}\.\d{2}"
              maxlength="5"
            />
          </div>

          <div class="form-group">
            <label for="wirtschaftsjahr-ende">Wirtschaftsjahr Ende</label>
            <input
              id="wirtschaftsjahr-ende"
              v-model="formData.wirtschaftsjahrEnde"
              type="text"
              required
              placeholder="dd.mm"
              pattern="\d{2}\.\d{2}"
              maxlength="5"
            />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="!hasChanges">
          {{ isEditMode ? 'Änderungen speichern' : 'Mandant erstellen' }}
        </button>
      </div>
    </form>
    <p>{{ debug }}</p>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, ref, onMounted, watch } from 'vue'
import Database from '@tauri-apps/plugin-sql'
import type { mandant } from '../../types/databaseTypes'

const props = defineProps<{
  mandantId?: string | null
}>()

let dbInstance: Database | null = null
let debug = ref('')

const getCompanyDb = async () => {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:company.db')
  }
  return dbInstance
}

interface MandantForm {
  mandantName: string
  zusatz: string
  adresszeile1: string
  adresszeile2: string
  plz: string
  ort: string
  verwaltungsart: 'WEG' | 'Mietverwaltung' | 'Sondereigentum' | ''
  wirtschaftsjahrBeginn: string
  wirtschaftsjahrEnde: string
}

const formData = reactive<MandantForm>({
  mandantName: '',
  zusatz: '',
  adresszeile1: '',
  adresszeile2: '',
  plz: '',
  ort: '',
  verwaltungsart: '',
  wirtschaftsjahrBeginn: '',
  wirtschaftsjahrEnde: ''
})

const initialData = ref<MandantForm | null>(null)

const isEditMode = computed(() => !!props.mandantId)

const hasChanges = computed(() => {
  if (!isEditMode.value) return true
  if (!initialData.value) return true
  return JSON.stringify(formData) !== JSON.stringify(initialData.value)
})

const loadMandantData = async () => {
  if (!props.mandantId) return

  try {
    const db = await getCompanyDb()
    const result = await db.select<mandant[]>(
      'SELECT * FROM mandanten WHERE id = ?',
      [props.mandantId]
    )

    if (result && result.length > 0) {
      const mandant = result[0]
      formData.mandantName = mandant.mandantName
      formData.zusatz = mandant.zusatz || ''
      formData.adresszeile1 = mandant.adresszeile1 || ''
      formData.adresszeile2 = mandant.adresszeile2 || ''
      formData.plz = mandant.plz
      formData.ort = mandant.ort
      formData.verwaltungsart = mandant.verwaltungsart
      formData.wirtschaftsjahrBeginn = mandant.wirtschaftsjahrBeginn
      formData.wirtschaftsjahrEnde = mandant.wirtschaftsjahrEnde

      initialData.value = { ...formData }
    }
  } catch (error) {
    debug.value = `Error loading mandant: ${error}`
  }
}

const generateId = () => {
  return `M${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

const handleSubmit = async () => {
  try {
    const db = await getCompanyDb()

    if (isEditMode.value) {
      const result = await db.execute(
        `UPDATE mandanten
         SET mandantName = ?, zusatz = ?, adresszeile1 = ?, adresszeile2 = ?,
             plz = ?, ort = ?, verwaltungsart = ?, wirtschaftsjahrBeginn = ?, wirtschaftsjahrEnde = ?
         WHERE id = ?`,
        [
          formData.mandantName,
          formData.zusatz,
          formData.adresszeile1,
          formData.adresszeile2,
          formData.plz,
          formData.ort,
          formData.verwaltungsart,
          formData.wirtschaftsjahrBeginn,
          formData.wirtschaftsjahrEnde,
          props.mandantId
        ]
      )
      debug.value = `Updated successfully: ${JSON.stringify(result)}`
      initialData.value = { ...formData }
    } else {
      const newId = generateId()
      const result = await db.execute(
        `INSERT INTO mandanten (id, mandantName, zusatz, adresszeile1, adresszeile2, plz, ort, verwaltungsart, wirtschaftsjahrBeginn, wirtschaftsjahrEnde)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          formData.mandantName,
          formData.zusatz,
          formData.adresszeile1,
          formData.adresszeile2,
          formData.plz,
          formData.ort,
          formData.verwaltungsart,
          formData.wirtschaftsjahrBeginn,
          formData.wirtschaftsjahrEnde
        ]
      )
      debug.value = `Created successfully with ID ${newId}: ${JSON.stringify(result)}`
    }
  } catch (error) {
    debug.value = `Error: ${error}`
  }
}

onMounted(() => {
  loadMandantData()
})

watch(() => props.mandantId, () => {
  loadMandantData()
})
</script>

<style scoped>
.mandantendaten-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: var(--p-text-color);
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--p-surface-100);
  border-radius: var(--p-border-radius-lg);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--p-text-color);
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--p-text-color);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--p-surface-border);
  border-radius: var(--p-border-radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
  background: var(--p-surface-0);
  color: var(--p-text-color);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 0.2rem var(--p-primary-color-emphasis);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--p-border-radius-md);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--p-primary-600);
}

.btn-primary:disabled {
  background-color: var(--p-surface-400);
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
