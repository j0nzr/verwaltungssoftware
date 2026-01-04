import { defineStore } from "pinia";
import { ref } from "vue";
import { companyData } from "../types/databaseTypes";

export const useCompanyDataStore = defineStore('companyData' , () => {
    const compData = ref<companyData | null>(null)

    return {compData}
    })