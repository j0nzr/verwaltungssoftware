<template>
    <div class="card">
        <Menubar :model="items">
            <template #item="{ item, props }">
                <a
                    v-ripple
                    class="menu-item"
                    :class="{ 'active-tab': isActiveTab(item) }"
                    v-bind="props.action"
                    @click="handleItemClick(item)"
                >
                    <span :class="item.icon"></span>
                    <span class="menu-label">{{ item.label }}</span>
                </a>
            </template>
        </Menubar>
    </div>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import Menubar from 'primevue/menubar';
    import { useAppListStore } from '../../stores/menuStores';

    const router = useRouter();
    const route = useRoute();

    const items = ref([
        {
            label: 'Start',
            icon: 'pi pi-home',
            to: '/'
        },
        {
            label: 'Finanzen',
            icon: 'pi pi-wallet',
            to: '/finanzen'
        },
        {
            label: 'Aufgaben',
            icon: 'pi pi-list',
            to: '/aufgaben'
        },
        {
            label: 'Tickets',
            icon: 'pi pi-ticket',
            to: '/tickets'
        }
    ]);

    const isActiveTab = (item: any) => {
        if(useAppListStore().activeSection == item.label) {
            return true
        }
        if (!item.to) return false;

        // Check if current route matches item route
        if (route.path === item.to) return true;

        // If no route matches and this is the home tab, make it active by default
        const hasActiveRoute = items.value.some(i => i.to === route.path);
        if (!hasActiveRoute && item.to === '/') return true;

        return false;
    };

    const handleItemClick = (item: any) => {
        if (item.to && route.path !== item.to) {
            useAppListStore().activeSection = item.label
            router.push(item.to);
        }
    };
</script>

<style scoped>
    .card {
        width: 100%;
        margin: 0;
        background: var(--p-surface-0);
    }

    .card :deep(.p-menubar) {
        background: var(--p-surface-0);
        border: none;
        border-top: 1px solid var(--p-surface-border);
    }

    * {
        font-size: large;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        color: var(--p-text-color);
        border-radius: var(--p-border-radius-sm);
    }

    .menu-item:hover {
        background-color: var(--p-surface-100);
    }

    .menu-item.active-tab {
        background-color: var(--p-primary-color);
        color: white;
        font-weight: 600;
    }

    .menu-item.active-tab:hover {
        background-color: var(--p-primary-600);
    }

    .menu-label {
        flex: 1;
    }
</style>