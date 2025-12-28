<template>
  <div class="unternehmensdaten-form">
    <h2>Unternehmensdaten</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <h3>Allgemeine Informationen</h3>

        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="formData.NAME"
            type="text"
            required
            placeholder="Firmenname"
          />
        </div>

        <div class="form-group">
          <label for="zusatz">Zusatz</label>
          <input
            id="zusatz"
            v-model="formData.ZUSA"
            type="text"
            placeholder="z.B. GmbH, AG, etc."
          />
        </div>
      </div>

      <div class="form-section">
        <h3>Adresse</h3>

        <div class="form-group">
          <label for="adresse1">Adresszeile 1</label>
          <input
            id="adresse1"
            v-model="formData.ADR1"
            type="text"
            required
            placeholder="Straße und Hausnummer"
          />
        </div>

        <div class="form-group">
          <label for="adresse2">Adresszeile 2</label>
          <input
            id="adresse2"
            v-model="formData.ADR2"
            type="text"
            placeholder="Zusätzliche Adressinformationen"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="plz">PLZ</label>
            <input
              id="plz"
              v-model="formData.POLZ"
              type="text"
              required
              placeholder="Postleitzahl"
            />
          </div>

          <div class="form-group">
            <label for="ort">Ort</label>
            <input
              id="ort"
              v-model="formData.STADT"
              type="text"
              required
              placeholder="Stadt"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Steuerinformationen</h3>

        <div class="form-group">
          <label for="steuernummer">Steuernummer</label>
          <input
            id="steuernummer"
            v-model="formData.STRN"
            type="text"
            placeholder="Steuernummer"
          />
        </div>

        <div class="form-group">
          <label for="umsatzsteuer">Umsatzsteuer-ID</label>
          <input
            id="umsatzsteuer"
            v-model="formData.USID"
            type="text"
            placeholder="DE123456789"
          />
        </div>
      </div>

      <div class="form-section">
        <h3>Direktor</h3>

        <div class="form-group">
          <label for="direktor-titel">Direktor-Titel</label>
          <input
            id="direktor-titel"
            v-model="formData.DIRT"
            type="text"
            placeholder="z.B. Dr., Prof."
          />
        </div>

        <div class="form-group">
          <label for="direktor-name">Direktor-Name</label>
          <input
            id="direktor-name"
            v-model="formData.DIRN"
            type="text"
            placeholder="Vor- und Nachname"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="!hasChanges">Speichern</button>
      </div>
    </form>
    <p> {{ debug }} </p>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, ref } from 'vue'
import Database from '@tauri-apps/plugin-sql'
import { useCompanyDataStore } from '../../stores/dataStores'

let dbInstance: Database | null = null
let debug = ref("")

const companyDataStore = useCompanyDataStore()

const getCompanyDb = async () => {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:company.db')
  }
  return dbInstance
}

interface UnternehmensdatenForm {
  NAME: string
  ZUSA: string
  ADR1: string
  ADR2: string
  POLZ: string
  STADT: string
  STRN: string
  USID: string
  DIRT: string
  DIRN: string
}

const formData = reactive<UnternehmensdatenForm>({
  NAME: companyDataStore.compData?.unternehmensname || '',
  ZUSA: companyDataStore.compData?.zusatz || '',
  ADR1: companyDataStore.compData?.adresszeile1 || '',
  ADR2: companyDataStore.compData?.adresszeile2 || '',
  POLZ: companyDataStore.compData?.plz || '',
  STADT: companyDataStore.compData?.ort || '',
  STRN: companyDataStore.compData?.steuernummer || '',
  USID: companyDataStore.compData?.umsatzsteuerId || '',
  DIRT: companyDataStore.compData?.direktorTitel || '',
  DIRN: companyDataStore.compData?.direktorName || ''
})

const initialData = ref<UnternehmensdatenForm>({
  NAME: formData.NAME,
  ZUSA: formData.ZUSA,
  ADR1: formData.ADR1,
  ADR2: formData.ADR2,
  POLZ: formData.POLZ,
  STADT: formData.STADT,
  STRN: formData.STRN,
  USID: formData.USID,
  DIRT: formData.DIRT,
  DIRN: formData.DIRN
})

// https://dl.vidsrc.vip/tv/1668/4/14

const hasChanges = computed(() => {
  if (!companyDataStore.compData) return true
  return JSON.stringify(formData) !== JSON.stringify(initialData.value)
})



const handleSubmit = async () => {
  try {
    const db = await getCompanyDb();
    const result = await db.execute(
      `INSERT INTO company_data (unternehmensname, zusatz, adresszeile1, adresszeile2, plz, ort, steuernummer, umsatzsteuerId, direktorTitel, direktorName, bearbeitet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [formData.NAME, formData.ZUSA, formData.ADR1, formData.ADR2, formData.POLZ, formData.STADT, formData.STRN, formData.USID, formData.DIRT, formData.DIRN, Date.now().toString()]
    );
    debug.value = result;
  } catch (error) {
    debug.value = error;
  }
}
</script>

<style scoped>
.unternehmensdaten-form {
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

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--p-surface-border);
  border-radius: var(--p-border-radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
  background: var(--p-surface-0);
  color: var(--p-text-color);
}

.form-group input:focus {
  outline: none;
  border-color: var(--p-primary-color);
  box-shadow: 0 0 0 0.2rem var(--p-primary-color-emphasis);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
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

.btn-secondary {
  background-color: var(--p-surface-500);
  color: white;
}

.btn-secondary:hover {
  background-color: var(--p-surface-600);
}
</style>
