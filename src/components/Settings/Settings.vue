<template>
  <div class="settings">
    <h1>Einstellungen</h1>

    <div class="settings-container">
      <!-- Appearance Section -->
      <div class="settings-section">
        <h2>
          <i class="pi pi-palette"></i>
          Erscheinungsbild
        </h2>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-label">
              <label for="dark-mode-toggle">
                <i class="pi pi-moon"></i>
                Dark Mode
              </label>
              <span class="setting-description">
                Zwischen hellem und dunklem Design wechseln
              </span>
            </div>
            <ToggleSwitch
              id="dark-mode-toggle"
              v-model="settingsStore.isDarkMode"
              @update:modelValue="handleDarkModeChange"
            />
          </div>

          <Divider />

          <div class="setting-item">
            <div class="setting-label">
              <label for="color-picker">
                <i class="pi pi-palette"></i>
                Primärfarbe
              </label>
              <span class="setting-description">
                Wählen Sie die Hauptfarbe der Anwendung
              </span>
            </div>
            <ColorPicker
              v-model="settingsStore.primaryColor"
              @update:modelValue="handleColorChange"
              format="hex"
            />
          </div>

          <div class="color-presets">
            <span class="presets-label">Voreinstellungen:</span>
            <div class="preset-colors">
              <button
                v-for="preset in colorPresets"
                :key="preset.name"
                class="preset-color-btn"
                :style="{ backgroundColor: preset.color }"
                :title="preset.name"
                @click="settingsStore.setPrimaryColor(preset.color)"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Section -->
      <div class="settings-section">
        <h2>
          <i class="pi pi-info-circle"></i>
          Information
        </h2>

        <div class="settings-card">
          <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value">0.1.0</span>
          </div>
          <Divider />
          <div class="info-item">
            <span class="info-label">Aktuelle Farbe:</span>
            <span class="info-value">{{ settingsStore.primaryColor }}</span>
          </div>
          <Divider />
          <div class="info-item">
            <span class="info-label">Theme:</span>
            <span class="info-value">{{ settingsStore.isDarkMode ? 'Dark' : 'Light' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useSettingsStore } from '../../stores/settingsStore';
import ToggleSwitch from 'primevue/toggleswitch';
import ColorPicker from 'primevue/colorpicker';
import Divider from 'primevue/divider';

const settingsStore = useSettingsStore();

const colorPresets = ref([
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Green', color: '#10B981' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Orange', color: '#F59E0B' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Indigo', color: '#6366F1' }
]);

const handleColorChange = (color: string) => {
  settingsStore.setPrimaryColor(color);
};

const handleDarkModeChange = () => {
  // Theme is automatically applied via the store's watcher
  settingsStore.applyTheme();
};

onMounted(() => {
  settingsStore.init();
});
</script>

<style scoped>
.settings {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--p-text-color);
  margin-bottom: 2rem;
  font-size: 2rem;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: var(--p-surface-0);
  border-radius: var(--p-border-radius-lg);
  overflow: hidden;
}

.settings-section h2 {
  background: var(--p-surface-100);
  padding: 1rem 1.5rem;
  margin: 0;
  font-size: 1.25rem;
  color: var(--p-text-color);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-card {
  padding: 1.5rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--p-text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.setting-description {
  font-size: 0.875rem;
  color: var(--p-text-secondary-color);
  opacity: 0.8;
}

.color-presets {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--p-surface-border);
}

.presets-label {
  font-size: 0.875rem;
  color: var(--p-text-secondary-color);
  margin-bottom: 0.5rem;
  display: block;
  opacity: 0.8;
}

.preset-colors {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-color-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--p-border-radius-md);
  border: 2px solid var(--p-surface-200);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-color-btn:hover {
  transform: scale(1.1);
  border-color: var(--p-text-color);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.info-label {
  font-weight: 600;
  color: var(--p-text-color);
}

.info-value {
  color: var(--p-text-secondary-color);
  font-family: monospace;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>