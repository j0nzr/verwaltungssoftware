import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppListStore = defineStore('appList' , () => {
    const mainAppList = ref([
    { label: 'Unternehmensdaten', icon: 'pi pi-building', to: '/Unternehmensdaten' },
    { label: 'Mandanten', icon: 'pi pi-users', to: '/Mandanten' },
    { label: 'Einstellungen', icon: 'pi pi-cog', to: '/' }
    ])

    const financeAppList = ref()
    // TODO: add Menu Items

    return {mainAppList, financeAppList}
    })