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
        <button type="submit" class="btn-primary">Speichern</button>
        <button type="button" class="btn-secondary" @click="handleReset">Zurücksetzen</button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

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
  NAME: '',
  ZUSA: '',
  ADR1: '',
  ADR2: '',
  POLZ: '',
  STADT: '',
  STRN: '',
  USID: '',
  DIRT: '',
  DIRN: ''
})

const handleSubmit = () => {
  console.log('Unternehmensdaten:', formData)
  // TODO: Implement save logic
}

const handleReset = () => {
  Object.keys(formData).forEach(key => {
    formData[key as keyof UnternehmensdatenForm] = ''
  })
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
  color: #2c3e50;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #495057;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
</style>
