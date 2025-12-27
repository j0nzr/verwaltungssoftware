<template>
    <div class="card">
        <Menubar :model="items" />
    </div>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import Menubar from 'primevue/menubar';

    const items = ref([
        {
            label: 'Start',
            icon: 'pi pi-home'
        },
        {
            label: 'Finanzen',
            icon: 'pi pi-wallet'
        },
        {
            label: 'Aufgaben',
            icon: 'pi pi-list'
        },
        {
            label: 'Tickets',
            icon: 'pi pi-ticket'
        }
    ]);
</script>

<style scoped>
    .card {
        width: 100%;
        margin: 0;
    }

    * {
        font-size: large;
    }
</style>