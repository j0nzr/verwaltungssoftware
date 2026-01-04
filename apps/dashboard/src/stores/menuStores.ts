import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAppListStore = defineStore('appList' , () => {

    const activeSection = ref<string>()

    const mainAppList = ref([
    { label: 'Unternehmensdaten', icon: 'pi pi-building', to: '/Unternehmensdaten' },
    { label: 'Mandanten', icon: 'pi pi-users', to: '/Mandanten' },
    { label: 'Einstellungen', icon: 'pi pi-cog', to: '/' }
    ])

    const financeAppList = ref([
    { label: 'Unternehmen', icon: 'pi pi-building', items: [
        {
            label: 'Offene Posten Liste',
            icon: 'pi pi-list',
            to: '' 
        },
        {
            label: 'Rechnungstellung',
            icon: 'pi pi-pen-to-square',
            to: '' 
        },
    ]},
    { label: 'Mandanten', icon: 'pi pi-users', items: [
        {
            label: 'Buchhaltung',
            icon: 'pi pi-pen-to-square',
            to: '/Finanzen/Buchhaltung'
        },
        {
            label: 'Offene Posten Liste',
            icon: 'pi pi-list',
            to: '' 
        },
        {
            label: 'Kontenblätter',
            icon: 'pi pi-list',
            to: '' 
        },
        {
            label: 'Kontenrahmen',
            icon: 'pi pi-pen-to-square',
            to: '' 
        },
    ] },
    { label: 'Einstellungen', icon: 'pi pi-cog', to: '/' }
    ])

    const currentMenu = computed(() => {
        switch (activeSection.value) {
            case "Start":
                return mainAppList.value
            case "Finanzen":
                return financeAppList.value   
            default:
                return new Error("Problem getting Active State or Menu")
        }
        })

    function init(initSection: string) {
        activeSection.value = initSection
    }
    return {currentMenu, activeSection, init}
    })