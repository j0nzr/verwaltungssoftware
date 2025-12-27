import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppListStore = defineStore('appList' , () => {
    const appList = ref([
    { label: 'Unternehmensdaten', icon: 'pi pi-building', to: '/Unternehmensdaten' },
    { label: 'Einstellungen', icon: 'pi pi-cog', to: '/' }
    ])

    return {appList}
    })