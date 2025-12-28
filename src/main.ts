import { createApp } from "vue";
import App from "./App.vue";

// PrimeVue
import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';
import 'primeicons/primeicons.css';
import './style.css';

// Pinia
import { createPinia } from "pinia";

// Router
import {router} from "./routes/mainRouer"

const app = createApp(App);
const pinia = createPinia();

app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            darkModeSelector: '.dark-mode',
            cssLayer: false
        }
    },
    ripple: true
});
app.use(pinia);
app.use(router);
app.mount("#app");