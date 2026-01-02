import { createMemoryHistory, createRouter, type RouteLocationNormalized } from "vue-router";

import Settings from "../components/Settings/Settings.vue";
import Unternehmensdaten from "../components/Organisationsdaten/Unternehmensdaten.vue";
import Mandantenübersicht from "../components/Mandanten/Mandantenübersicht.vue";
import Mandantendaten from "../components/Mandanten/Mandantendaten.vue";

const routes = [
    {path: '/', component: Settings},
    {path: '/Unternehmensdaten', component: Unternehmensdaten},
    {path: '/Mandanten', name: 'MandantenList', component: Mandantenübersicht, props:{ tableHeader: 'id, mandantName', goTo: 'MandantEdit' }},
    {path: '/Mandanten/neu', name: 'MandantCreate', component: Mandantendaten},
    {path: '/Mandanten/:id', name: 'MandantEdit', component: Mandantendaten, props: (route: RouteLocationNormalized) => ({ mandantId: route.params.id as string })},
    {path: '/Finanzen/Buchhaltung', name: "FinanzenOverview", component: Mandantenübersicht, props: {tableHeader: 'id, mandantName, aktuellesWirtschaftsjahr', goTo: 'MandantEdit'}}

]

export const router = createRouter({
    history: createMemoryHistory(),
    routes
})