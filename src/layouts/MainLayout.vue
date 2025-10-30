<script setup lang="ts">
import SideNav from '../components/SideNav.vue'
import TopBar from '../components/TopBar.vue'
</script>

<template>
  <div class="flex h-screen bg-[var(--app-bg)]">
    <SideNav />
    <div class="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <div class="flex-1 overflow-auto p-0">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
