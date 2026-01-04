<script setup lang="ts">
import ImportJournalEntries from './components/ImportJournalEntries.vue';
import SideMenu from './components/SideMenu.vue';

</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <SideMenu />
    </aside>
    <div class="content-wrapper">
      <main class="main-content">
        <!-- <RouterView /> -->
         <ImportJournalEntries />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
  overflow-y: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
}

.content-wrapper {
  margin-left: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.bottom-menu {
  flex-shrink: 0;
}
</style>