<template>

<Stepper value="1">
    <StepList>
        <Step value="1">Datei auswählen</Step>
        <Step value="2">Zuordnung</Step>
        <Step value="3">Buchungen erstellen</Step>
    </StepList>
    <StepPanels>
        <StepPanel v-slot="{ activateCallback }" value="1">
            <div class="flex flex-col gap-4">
                <Button label="Datei auswählen" @click="selectFile" icon="pi pi-folder-open" />
                <div v-if="selectedFilePath">
                    <p><strong>Ausgewählte Datei:</strong> {{ selectedFilePath }}</p>
                </div>
                <div v-if="fileContent">
                    <p><strong>Dateiinhalt:</strong></p>
                    <pre>{{ fileContent }}</pre>
                </div>
            </div>
            <div class="flex pt-6 justify-end">
                <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('2')" :disabled="!selectedFilePath" />
            </div>
        </StepPanel>
    </StepPanels>
</Stepper>

</template>

<script setup lang="ts">
    import Stepper from 'primevue/stepper';
    import StepList from 'primevue/steplist';
    import StepPanels from 'primevue/steppanels';
    import Step from 'primevue/step';
    import StepPanel from 'primevue/steppanel';
    import Button from 'primevue/button';
    import { ref } from 'vue';
    import { open } from '@tauri-apps/plugin-dialog';
    import { readTextFile } from '@tauri-apps/plugin-fs';

    const selectedFilePath = ref<string>('')
    const fileContent = ref<string>('')

    const selectFile = async () => {
        try {
            // Open file dialog to select a file
            const selected = await open({
                multiple: false,
                directory: false,
                filters: [{
                    name: 'CSV/Text Files',
                    extensions: ['csv', 'txt']
                }]
            });

            if (selected && typeof selected === 'string') {
                selectedFilePath.value = selected;

                // Read the file content
                const content = await readTextFile(selected);
                fileContent.value = content;
            }
        } catch (error) {
            console.error('Error selecting or reading file:', error);
        }
    }

</script>