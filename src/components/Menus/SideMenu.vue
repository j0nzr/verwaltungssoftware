<template>
  <PanelMenu :model="menuItems"/>
  <!-- <div class="app-launcher-container">
    <div class="app-launcher-grid">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="app-launcher-item"
        @click="handleItemClick(item)"
      >
        <div class="app-launcher-content">
          <i v-if="item.icon" :class="['app-launcher-icon', item.icon]"></i>
          <span class="app-launcher-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div> -->
</template>

<script setup lang="ts">
import { useAppListStore } from '../../stores/menuStores';
import { PanelMenu } from 'primevue';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const router = useRouter();
const appListStore = useAppListStore();

// Create menu items with command functions for navigation
const menuItems = computed(() =>
  appListStore.appList.map(item => ({
    ...item,
    command: () => {
      if (item.to) {
        router.push(item.to);
      }
    }
  }))
);

console.log(menuItems.value);

// const handleItemClick = (item: MenuItem) => {
//   if (item.disabled) return;

//   if (item.command) {
//     item.command({ originalEvent: new Event('click'), item });
//   }

//   if (item.url) {
//     if (item.target) {
//       window.open(item.url, item.target);
//     } else {
//       window.location.href = item.url;
//     }
//   }
// };
</script>

<style scoped>
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
