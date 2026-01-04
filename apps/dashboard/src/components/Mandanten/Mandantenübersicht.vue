<template>
  <div class="mandanten-overview">
    <div class="header">
      <h2>Mandantenübersicht</h2>
      <Button
        label="Neuer Mandant"
        icon="pi pi-plus"
        @click="createNewMandant"
        severity="success"
      />
    </div>

    <DataTable
      :value="mandanten"
      :loading="loading"
      stripedRows
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      tableStyle="min-width: 50rem"
      @row-click="onRowClick"
      class="clickable-rows"
    >

    <Column v-for="header in dataHeaders" :key="header" :field="header" :header="mdt[header as keyof typeof mdt]" sortable/>

      <Column header="Aktionen" style="width: 10%">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            severity="info"
            text
            rounded
            @click.stop="enterMandant(slotProps.data.id)"
          /><Button
            icon="pi pi-trash"
            severity="info"
            text
            rounded
            @click.stop="deleteMandant(slotProps.data.id)"
          />
        </template>
      </Column>

      <template #empty>
        <div class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <p>Keine Mandanten gefunden</p>
          <Button
            label="Ersten Mandant erstellen"
            icon="pi pi-plus"
            @click="createNewMandant"
            severity="success"
          />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Database from '@tauri-apps/plugin-sql'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import type { mandant } from '../../types/databaseTypes'
import { mandanten as mdt } from '../../libraries/databaseHeaders'
import { error, info } from '@tauri-apps/plugin-log'

const router = useRouter()
const mandanten = ref<mandant[]>([])
const loading = ref(false)


/*
 * Da die Komponente möglichst flexibel verwendet werden soll,
 * werden die Headers als Prop übergeben. Dies passiert entweder
 * programmatisch über die router.push funktion oder über die 
 * Verlinkung im Pinia Store 
 */
const props = defineProps<{
   tableHeader: string,
   goTo: string
 }>()
const dataHeaders = ref<string[]>()

/**
 * Über diesen Prop soll festgelegt werden  
 * wo der Nutzer hin gesendet wird
 * wenn er auf eine Reihe klickt
 */

const goTo = props.goTo 

let dbInstance: Database | null = null

const getCompanyDb = async () => {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:company.db')
  }
  return dbInstance
}

const loadMandanten = async () => {
  loading.value = true
  try {
    dataHeaders.value = props.tableHeader.split(',')
    dataHeaders.value.forEach((h, index) => {
      h = h.trimEnd()
      h = h.trimStart()
      dataHeaders.value![index] = h // Das dataHeaders.value definiert sein muss ergibt sich direkt aus der forEach-Loop!
    })
  } catch(e) {
    error(`Problem beim Setzen des Tabellenheader in ${router.currentRoute}: ${e}`)
  }

  try {
    const db = await getCompanyDb()
    const result = await db.select<mandant[]>(`SELECT ${props.tableHeader ? props.tableHeader : '*' } FROM mandanten ORDER BY mandantName`)
    //const result = await db.select<mandant[]>('SELECT * FROM mandanten ORDER BY mandantName')
    mandanten.value = result || []
  } catch (e) {
    error(`Error loading mandanten: ${e}`)
  } finally {
    loading.value = false
  }
}

const createNewMandant = () => {
  router.push({ name: 'MandantCreate' })
}

const enterMandant = (id: string) => {
  router.push({ name: goTo, params: { id } })
}

const deleteMandant = async (id: string) => {
  try {
    const db = await getCompanyDb()
    const result = await db.execute(`DELETE FROM mandanten WHERE id='${id}'`)
    info(`Mandant versucht zu löschen. Ergebnis: ${JSON.stringify(result)}`)
  } catch (e) {
    error(<string>e); // Errors sind üblicherweise strings
  }
}

const onRowClick = (event: any) => {
  enterMandant(event.data.id)
}

onMounted(() => {
  loadMandanten()
})
</script>

<style scoped>
.mandanten-overview {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h2 {
  margin: 0;
  color: var(--p-text-color);
}

.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

.clickable-rows :deep(tbody tr:hover) {
  background-color: var(--p-surface-100) !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.empty-state p {
  color: var(--p-text-secondary-color);
  font-size: 1.1rem;
  margin: 0;
}

.empty-icon {
  font-size: 3rem;
  color: var(--p-text-muted-color);
  opacity: 0.6;
}

/* Fix DataTable backgrounds for dark mode */
.clickable-rows :deep(.p-datatable) {
  background: var(--p-surface-0);
}

.clickable-rows :deep(.p-datatable-header),
.clickable-rows :deep(.p-datatable-thead > tr > th) {
  background: var(--p-surface-100);
  color: var(--p-text-color);
  border-color: var(--p-surface-border);
}

.clickable-rows :deep(.p-datatable-tbody > tr) {
  background: var(--p-surface-0);
  color: var(--p-text-color);
}

.clickable-rows :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--p-surface-border);
}

.clickable-rows :deep(.p-paginator) {
  background: var(--p-surface-0);
  color: var(--p-text-color);
  border-color: var(--p-surface-border);
}
</style>
