<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

const dashboard = ref({ totalFiles: 0, imageFiles: 0, videoFiles: 0, sharedFiles: 0 })
const ai = ref<Array<{ name: string; count: number; icon: string }>>([])
const recent = ref<any[]>([])
const storage = ref({ usedBytes: 0, capacityBytes: 10 * 1024 * 1024 * 1024, usedPercent: 0 })
const loading = ref(true)

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

async function fetchAll() {
  try {
    loading.value = true
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
  } finally {
    loading.value = false
  }
}

const topCards = computed(() => ([
  { title: '总文件数', value: dashboard.value.totalFiles, emoji: '📁', accent: 'bg-sky-100 text-sky-600' },
  { title: '图片文件', value: dashboard.value.imageFiles, emoji: '🖼️', accent: 'bg-emerald-100 text-emerald-600' },
  { title: '视频文件', value: dashboard.value.videoFiles, emoji: '🎥', accent: 'bg-amber-100 text-amber-600' },
  { title: '共享文件', value: dashboard.value.sharedFiles, emoji: '🔗', accent: 'bg-violet-100 text-violet-600' },
]))

onMounted(fetchAll)
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-6">仪表盘</h2>

    <!-- 顶部统计卡片，带图标色块与悬浮阴影 -->
    <a-grid :cols="24" :col-gap="24" :row-gap="24" class="mb-8">
      <a-grid-item v-for="c in topCards" :key="c.title" :span="{ xs: 24, sm: 12, md: 12, lg: 6 }">
        <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-all">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-slate-500 text-xs">{{ c.title }}</div>
              <div class="text-2xl font-semibold text-slate-800 mt-1">{{ c.value }}</div>
            </div>
            <div class="w-11 h-11 rounded-xl flex items-center justify-center ring-4 ring-white shadow-sm"
              :class="c.accent">
              <span class="text-xl">{{ c.emoji }}</span>
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <a-grid :cols="24" :col-gap="16" :row-gap="16">
      <!-- AI 处理统计 -->
      <a-grid-item :span="{ xs: 24, lg: 12 }">
        <a-card title="AI 处理统计" :bordered="false" class="shadow-sm">
          <a-skeleton v-if="loading" :loading="loading" :animation="true">
            <a-skeleton-line :rows="6" />
          </a-skeleton>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="(feature, idx) in ai" :key="idx" class="flex items-center justify-between py-3 group">
              <div class="flex items-center min-w-0">
                <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                  <span class="text-lg">{{ feature.icon }}</span>
                </div>
                <span class="truncate">{{ feature.name }}</span>
              </div>
              <a-badge :count="feature.count" :max-count="999" class="group-hover:scale-[1.02] transition-transform" />
            </div>
          </div>
        </a-card>
      </a-grid-item>

      <!-- 最近上传 -->
      <a-grid-item :span="{ xs: 24, lg: 12 }">
        <a-card title="最近上传" :bordered="false" class="shadow-sm">
          <template #extra>
            <div class="flex items-center gap-3 text-xs text-slate-500">
              <span>存储：{{ formatBytes(storage.usedBytes) }} / {{ formatBytes(storage.capacityBytes) }}</span>
            </div>
          </template>
          <a-skeleton v-if="loading" :loading="loading" :animation="true">
            <a-skeleton-line :rows="5" />
          </a-skeleton>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="file in recent" :key="file.id"
              class="flex items-center justify-between py-3 group hover:bg-slate-50 rounded-md px-2 -mx-2">
              <div class="flex items-center min-w-0">
                <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-lg">{{
                  file.thumbnail }}
                </div>
                <div class="min-w-0">
                  <a-link :href="`/files/${encodeURIComponent(file.name)}`" target="_blank"
                    class="block truncate text-slate-800">{{ file.name }}</a-link>
                  <div class="text-xs text-slate-500">{{ file.size }} • {{ file.date }}</div>
                </div>
              </div>
              <a-tag size="small" color="arcoblue">{{ file.status }}</a-tag>
            </div>
            <div v-if="recent.length === 0" class="py-6"><a-empty description="无最近上传" /></div>
          </div>

          <div class="mt-4">
            <a-progress :percent="storage.usedPercent / 100" :show-text="false" stroke-color="#22c55e" />
            <div class="text-xs text-slate-500 mt-1">已用 {{ formatBytes(storage.usedBytes) }}（{{ storage.usedPercent }}%）
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<style scoped></style>
