import { createMemoryHistory, createRouter } from "vue-router";

import Settings from "../components/Settings/Settings.vue";
import Unternehmensdaten from "../components/Organisationsdaten/Unternehmensdaten.vue";

const routes = [
    {path: '/', component: Settings},
    {path: '/Unternehmensdaten', component: Unternehmensdaten}
]

export const router = createRouter({
    history: createMemoryHistory(),
    routes
})