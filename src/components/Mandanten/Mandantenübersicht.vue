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

    <Column v-for="header in tableHeaders" :key="header" :field="header" :header="mdt[header as keyof typeof mdt]" sortable/>

      <!-- <Column field="id" header="ID" sortable style="width: 15%"></Column>
      <Column field="mandantName" header="Mandant-Name" sortable style="width: 20%"></Column>
      <Column field="zusatz" header="Zusatz" sortable style="width: 15%"></Column>
      <Column field="ort" header="Ort" sortable style="width: 15%"></Column>
      <Column field="plz" header="PLZ" sortable style="width: 10%"></Column>
      <Column field="verwaltungsart" header="Verwaltungsart" sortable style="width: 15%"></Column> -->
      <Column header="Aktionen" style="width: 10%">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            severity="info"
            text
            rounded
            @click.stop="editMandant(slotProps.data.id)"
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

const router = useRouter()
const mandanten = ref<mandant[]>([])
const loading = ref(false)

const tableHeaders = defineProps<{
   tableHeader: string
 }>()

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
    const db = await getCompanyDb()
    const result = await db.select<mandant[]>(`SELECT ${tableHeaders.tableHeader ? tableHeaders.tableHeader : '*' } FROM mandanten ORDER BY mandantName`)
    //const result = await db.select<mandant[]>('SELECT * FROM mandanten ORDER BY mandantName')
    mandanten.value = result || []
  } catch (error) {
    console.error('Error loading mandanten:', error)
  } finally {
    loading.value = false
  }
}

const createNewMandant = () => {
  router.push({ name: 'MandantCreate' })
}

const editMandant = (id: string) => {
  router.push({ name: 'MandantEdit', params: { id } })
}

const onRowClick = (event: any) => {
  editMandant(event.data.id)
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
