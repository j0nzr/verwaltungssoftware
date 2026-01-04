import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';
import 'primeicons/primeicons.css';
import '../../../../src/style.css';

const app = createApp(App)

app.use(router)

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

app.mount('#app')
