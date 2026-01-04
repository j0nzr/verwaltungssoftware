import { defineStore } from "pinia";

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        isDarkMode: false,
        primaryColor: '#3B82F6' // Default blue color
    }),

    actions: {
        // Apply theme to document
        applyTheme() {
            const html = document.documentElement;

            // Apply dark mode
            if (this.isDarkMode) {
                html.classList.add('dark-mode');
            } else {
                html.classList.remove('dark-mode');
            }

            // Apply primary color
            html.style.setProperty('--p-primary-color', this.primaryColor);
            html.style.setProperty('--p-primary-50', this.adjustColorBrightness(this.primaryColor, 0.95));
            html.style.setProperty('--p-primary-100', this.adjustColorBrightness(this.primaryColor, 0.9));
            html.style.setProperty('--p-primary-200', this.adjustColorBrightness(this.primaryColor, 0.8));
            html.style.setProperty('--p-primary-300', this.adjustColorBrightness(this.primaryColor, 0.6));
            html.style.setProperty('--p-primary-400', this.adjustColorBrightness(this.primaryColor, 0.4));
            html.style.setProperty('--p-primary-500', this.primaryColor);
            html.style.setProperty('--p-primary-600', this.adjustColorBrightness(this.primaryColor, -0.1));
            html.style.setProperty('--p-primary-700', this.adjustColorBrightness(this.primaryColor, -0.2));
            html.style.setProperty('--p-primary-800', this.adjustColorBrightness(this.primaryColor, -0.3));
            html.style.setProperty('--p-primary-900', this.adjustColorBrightness(this.primaryColor, -0.4));
        },

        // Helper function to adjust color brightness
        adjustColorBrightness(color: string, amount: number): string {
            const hex = color.replace('#', '');
            const num = parseInt(hex, 16);

            let r = (num >> 16) + Math.round(255 * amount);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * amount);
            let b = (num & 0x0000FF) + Math.round(255 * amount);

            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));

            return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
        },

        // Set primary color
        setPrimaryColor(color: string) {
            this.primaryColor = color;
            this.applyTheme();
        },

        // Toggle dark mode
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            this.applyTheme();
        },

        // Initialize and apply theme
        init() {
            this.applyTheme();
        }
    }
});
