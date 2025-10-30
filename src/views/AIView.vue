<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { jobsApi } from '../api/client'
import { Message } from '@arco-design/web-vue'
import type { TableColumnData } from '@arco-design/web-vue'

const jobs = ref<any[]>([])
const loading = ref(false)
const apiError = ref<string>('')
// 与服务端时间的偏移（ms），用于修正浏览器与服务端时钟差导致的进度异常
const serverOffsetMs = ref(0)
let timer: any = null
const load = async () => {
  try {
    const res = await jobsApi.list()
    jobs.value = res.data
    // 读取响应头的 Date，校准时钟偏移，避免因本地时间与服务端时间不一致导致进度条异常
    const dateHeader = (res as any)?.headers?.['date'] || (res as any)?.headers?.['Date']
    if (dateHeader) {
      const serverNow = new Date(dateHeader).getTime()
      serverOffsetMs.value = serverNow - Date.now()
    }
    apiError.value = ''
  } catch (e: any) {
    console.error('[load jobs failed]', e)
    apiError.value = '无法连接后端服务，请检查后端是否已启动（默认 http://localhost:3001）或端口转发设置。'
  }
}
const enqueue = async (type: string) => {
  try {
    loading.value = true
    await jobsApi.create(type, { note: 'demo' })
    Message.success('已加入队列')
    await load()
  } finally {
    loading.value = false
  }
}

const cancelJob = async (id: string) => {
  await jobsApi.cancel(id)
  Message.info('已取消任务')
  await load()
}

const statusColor = (s: string) => s === 'done' ? 'green' : (s === 'processing' ? 'arcoblue' : (s === 'canceled' ? 'red' : 'orange'))
const statusEmoji = (s: string) => s === 'done' ? '✅' : (s === 'processing' ? '⏳' : (s === 'canceled' ? '✖️' : '🕒'))
const remainingSeconds = (createdAt: string, status: string) => {
  if (status === 'done' || status === 'canceled') return 0
  const start = new Date(createdAt).getTime()
  const now = Date.now() + serverOffsetMs.value
  const passed = Math.floor((now - start) / 1000)
  const total = 10
  return Math.max(0, total - passed)
}
// 进度按两阶段计算：
// - queued: 0% -> 19%（0~2s）
// - processing: 20% -> 99%（2~10s），完成为 100%
const progressPercent = (createdAt: string, status: string) => {
  const start = new Date(createdAt).getTime()
  const now = Date.now() + serverOffsetMs.value
  const elapsed = Math.max(0, (now - start) / 1000)
  if (status === 'canceled') return 0
  if (status === 'done') return 100
  if (status === 'queued') {
    // 0~2s -> 0~19%
    const pct = Math.floor(Math.min(19, (elapsed / 2) * 20))
    return Math.max(0, pct)
  }
  if (status === 'processing') {
    // 2~10s -> 20~99%
    const procElapsed = Math.max(0, elapsed - 2)
    const pct = Math.floor(20 + Math.min(79, (procElapsed / 8) * 80))
    return Math.min(99, Math.max(20, pct))
  }
  return 0
}

type Feature = { key: string; title: string; desc: string; emoji: string; gradient: string; accent: string }
const features: Feature[] = [
  { key: 'thumbnail', title: '图像缩略图', desc: '生成预览图（模拟）', emoji: '🖼️', gradient: 'from-blue-50 to-indigo-50', accent: 'bg-blue-200' },
  { key: 'transcode', title: '视频转码', desc: 'H.264/H.265（模拟）', emoji: '🎞️', gradient: 'from-amber-50 to-orange-50', accent: 'bg-amber-200' },
  { key: 'moderation', title: '图片审核', desc: '敏感信息检测（模拟）', emoji: '🛡️', gradient: 'from-violet-50 to-fuchsia-50', accent: 'bg-violet-200' },
  { key: 'classification', title: '图片分类', desc: '内容识别与分类（模拟）', emoji: '🏷️', gradient: 'from-cyan-50 to-teal-50', accent: 'bg-cyan-200' },
  { key: 'ocr', title: '图片文字识别（OCR）', desc: '提取图片文字（模拟）', emoji: '🔤', gradient: 'from-emerald-50 to-green-50', accent: 'bg-emerald-200' },
  { key: 'asr', title: '语音识别（ASR）', desc: '音频转写文本（模拟）', emoji: '🎤', gradient: 'from-rose-50 to-pink-50', accent: 'bg-rose-200' },
]

// 使用 columns API 定义表格列
const columns: TableColumnData[] = [
  { title: '任务ID', dataIndex: 'id' },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', slotName: 'status' },
  { title: '进度', slotName: 'progress' },
  { title: '剩余(秒)', slotName: 'remain' },
  { title: '创建时间', dataIndex: 'createdAt' },
  { title: '操作', slotName: 'actions' },
]

onMounted(async () => {
  await load()
  timer = setInterval(load, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-4">AI 实验室</h2>

    <a-alert v-if="apiError" type="error" :show-icon="true" class="mb-4">
      {{ apiError }}
    </a-alert>

    <a-grid :cols="24" :col-gap="16" :row-gap="16" class="mb-6">
      <a-grid-item v-for="f in features" :key="f.key" :span="{ xs: 24, sm: 12, md: 12, lg: 8 }">
        <a-card :bordered="false" class="group relative shadow-sm hover:shadow-xl transition-all h-full overflow-hidden">
          <div :class="['absolute inset-0 opacity-70 pointer-events-none bg-gradient-to-br', f.gradient]"></div>
          <div class="relative flex items-start justify-between">
            <div class="flex items-start">
              <div class="w-11 h-11 rounded-xl mr-3 flex items-center justify-center ring-4 ring-white shadow-sm" :class="f.accent">
                <span class="text-xl">{{ f.emoji }}</span>
              </div>
              <div>
                <div class="font-semibold text-slate-800 group-hover:translate-x-0.5 transition-transform">{{ f.title }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ f.desc }}</div>
              </div>
            </div>
            <a-tooltip content="加入任务队列（模拟处理）">
              <a-button type="primary" size="small" :loading="loading" class="transition-transform group-hover:scale-[1.02]" @click="enqueue(f.key)">提交任务</a-button>
            </a-tooltip>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <a-card title="任务队列" :bordered="false" class="shadow-sm">
      <template v-if="jobs.length > 0">
        <a-table :data="jobs" :columns="columns" :pagination="false" row-key="id">
          <template #status="{ record }">
            <a-space>
              <span>{{ statusEmoji(record.status) }}</span>
              <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
            </a-space>
          </template>
          <template #progress="{ record }">
            <a-progress :percent="progressPercent(record.createdAt, record.status)" :show-text="false" style="width: 140px" />
          </template>
          <template #remain="{ record }">
            {{ remainingSeconds(record.createdAt, record.status) }}
          </template>
          <template #actions="{ record }">
            <a-button v-if="record.status==='queued' || record.status==='processing'" size="mini" status="danger" @click="cancelJob(record.id)">取消</a-button>
          </template>
        </a-table>
      </template>
      <template v-else>
        <a-empty description="暂无任务，点击上方任意功能卡片提交任务" />
      </template>
    </a-card>
  </div>
</template>

<style scoped></style>
