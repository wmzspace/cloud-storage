<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

const dashboard = ref({ totalFiles: 0, imageFiles: 0, videoFiles: 0, sharedFiles: 0 })
const ai = ref<Array<{name:string;count:number;icon:string}>>([])
const recent = ref<any[]>([])
const storage = ref({ usedBytes: 0, capacityBytes: 10 * 1024 * 1024 * 1024, usedPercent: 0 })

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B','KB','MB','GB','TB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

async function fetchAll() {
  const [stats, aiRes, recentRes, storageRes] = await Promise.all([
    api.get('/stats/dashboard'),
    api.get('/stats/ai'),
    api.get('/files/recent', { params: { limit: 4 } }),
    api.get('/stats/storage'),
  ])
  dashboard.value = stats.data
  ai.value = aiRes.data
  recent.value = recentRes.data
  storage.value = storageRes.data
}

onMounted(fetchAll)
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">仪表盘</h2>

    <a-grid :cols="24" :col-gap="24" :row-gap="24" class="mb-8">
      <a-grid-item :span="6"><a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow"><a-statistic title="总文件数" :value="dashboard.totalFiles" /></a-card></a-grid-item>
      <a-grid-item :span="6"><a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow"><a-statistic title="图片文件" :value="dashboard.imageFiles" /></a-card></a-grid-item>
      <a-grid-item :span="6"><a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow"><a-statistic title="视频文件" :value="dashboard.videoFiles" /></a-card></a-grid-item>
      <a-grid-item :span="6"><a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow"><a-statistic title="共享文件" :value="dashboard.sharedFiles" /></a-card></a-grid-item>
    </a-grid>

    <a-grid :cols="2" :col-gap="16" :row-gap="16">
      <a-grid-item>
        <a-card title="AI处理统计">
          <div class="space-y-4">
            <div v-for="(feature, idx) in ai" :key="idx" class="flex items-center justify-between">
              <div class="flex items-center"><span class="text-2xl mr-3">{{ feature.icon }}</span><span>{{ feature.name }}</span></div>
              <a-tag color="blue">{{ feature.count }}</a-tag>
            </div>
          </div>
        </a-card>
      </a-grid-item>
      <a-grid-item>
        <a-card title="最近上传">
          <div class="space-y-3">
            <div v-for="file in recent" :key="file.id" class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ file.thumbnail }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ file.name }}</p>
                  <p class="text-xs text-gray-500">{{ file.size }} • {{ file.date }}</p>
                </div>
              </div>
              <a-tag color="arcoblue">{{ file.status }}</a-tag>
            </div>
          </div>
          <template #extra>
            <div class="text-xs text-slate-500">存储：{{ formatBytes(storage.usedBytes) }} / {{ formatBytes(storage.capacityBytes) }}</div>
          </template>
        </a-card>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<style scoped>
</style>
