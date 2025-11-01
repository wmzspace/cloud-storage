<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { IconApps, IconFolder, IconShareInternal, IconEye, IconFile, IconSettings, IconImage } from '@arco-design/web-vue/es/icon'
const route = useRoute(); const router = useRouter()
const active = computed(() => route.path)
const onClick = (key: string) => router.push(key)
</script>

<template>
  <div class="w-64 bg-white border-r border-slate-200 p-0 flex flex-col">
    <div class="flex items-center p-4 h-16 border-b border-slate-200">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">C</div>
      <h1 class="text-xl font-bold text-slate-800">智能云盘</h1>
    </div>

    <div class="p-3">
      <a-menu :selected-keys="[active]" :style="{ width: '100%', border: 'none' }" @menu-item-click="onClick">
        <a-menu-item key="/"><template #icon><icon-apps /></template>仪表盘</a-menu-item>
        <a-menu-item key="/my-files"><template #icon><icon-folder /></template>我的文件</a-menu-item>
        <a-menu-item key="/shares"><template #icon><icon-share-internal /></template>共享</a-menu-item>
        <a-menu-item key="/ai"><template #icon><icon-eye /></template>AI 实验室</a-menu-item>
      </a-menu>
    </div>

    <div class="mt-auto p-4 bg-slate-50 rounded-lg m-3">
      <h3 class="font-semibold text-slate-800 mb-2 text-sm">提示</h3>
      <p class="text-xs text-slate-500">支持上传/下载/分享；AI 功能通过任务队列模拟。</p>
    </div>
  </div>

</template>

<style scoped>
.arco-menu-item {
  border-radius: 0.5rem;
  margin-bottom: 0.25rem;
}

.arco-menu-selected,
.arco-menu-item:hover {
  background-color: rgb(239 246 255);
  color: rgb(37 99 235);
}
</style>
