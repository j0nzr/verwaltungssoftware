<template>
  <div class="logo-container">
    <img src="../../assets/logo.png" alt="Logo" class="menu-logo" />
  </div>
  <PanelMenu :model="menuItems"/>
</template>

<script setup lang="ts">
import { useAppListStore } from '../../stores/menuStores';
import { PanelMenu } from 'primevue';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { error } from '@tauri-apps/plugin-log';

const router = useRouter();
const appListStore = useAppListStore();

// Recursive function to add command to all menu items (including nested ones)
const addCommandToMenuItem = (item: any): any => {
  const menuItem = {
    ...item,
    command: item.to ? () => router.push({ path: item.to }) : undefined
  };

  // Recursively process nested items if they exist
  if (item.items && Array.isArray(item.items)) {
    menuItem.items = item.items.map(addCommandToMenuItem);
  }

  return menuItem;
};

// Create menu items with command functions for navigation
const menuItems = computed(() => {
  if(appListStore.currentMenu instanceof Error){
    error(`Problem bei der Einsetzung des Seiten-Menüs von ${appListStore.currentMenu}`);
    return [];
  }

  return appListStore.currentMenu.map(addCommandToMenuItem);
});
</script>

<style scoped>
.logo-container {
  width: 100%;
  padding: 1.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--p-surface-200);
  margin-bottom: 1rem;
}

.menu-logo {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  object-fit: contain;
}

.app-launcher-container {
  width: 100%;
  padding: 1rem;
}

.app-launcher-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  width: 100%;
}

.app-launcher-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  border-radius: var(--p-border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 1rem;
}

.app-launcher-item:hover:not(.disabled) {
  background: var(--p-surface-50);
  border-color: var(--p-primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.app-launcher-item:active:not(.disabled) {
  transform: translateY(0);
}

.app-launcher-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-launcher-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  width: 100%;
}

.app-launcher-icon {
  font-size: 2.5rem;
  color: var(--p-primary-color);
}

.app-launcher-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--p-text-color);
  word-break: break-word;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .app-launcher-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .app-launcher-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .app-launcher-icon {
    font-size: 2rem;
  }

  .app-launcher-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .app-launcher-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
