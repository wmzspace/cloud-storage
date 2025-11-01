<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
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
const statusText = (s: string) => s === 'done' ? '已完成' : (s === 'processing' ? '处理中' : (s === 'canceled' ? '已取消' : (s === 'queued' ? '排队中' : s)))

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const deleteJob = async (id: string) => {
  try {
    await jobsApi.remove(id)
    Message.success('已删除任务')
    await load()
  } catch (e: any) {
    console.error('[delete job failed]', e)
    const status = e?.response?.status
    if (status === 404) {
      // 后端未实现 DELETE /jobs/:id，回退为取消任务并提示用户
      try {
        await jobsApi.update(id, { cancel: true })
        Message.info('后端不支持删除接口，已将任务标记为已取消')
        await load()
        return
      } catch (err2) {
        console.error('[fallback cancel failed]', err2)
      }
    }
    Message.error('删除任务失败')
  }
}

const typeText = (t: string) => {
  const m: Record<string, string> = {
    thumbnail: '图像缩略图',
    transcode: '视频转码',
    moderation: '图片审核',
    classification: '图片分类',
    ocr: '图片文字识别',
    asr: '语音识别',
  }
  return m[t] || t
}

// 结果查看 UI 的状态与模拟数据
const resultVisible = ref(false)
const resultJob = ref<any | null>(null)
const resultData = ref<any | null>(null)

const getMockResult = (job: any) => {
  const common = {
    id: job.id,
    type: job.type,
    createdAt: job.createdAt,
    summary: ''
  }
  switch (job.type) {
    case 'thumbnail':
      return { ...common, summary: '已为该图像生成 3 个尺寸的预览图。', previews: ['200x200', '400x300', '800x600'] }
    case 'transcode':
      return {
        ...common,
        summary: '已完成多码率转码，可用于自适应播放。',
        outputs: [
          { format: 'H.264', resolution: '1080p', size: '20MB' },
          { format: 'H.264', resolution: '720p', size: '12MB' },
          { format: 'H.265', resolution: '480p', size: '6MB' }
        ]
      }
    case 'moderation':
      return {
        ...common,
        summary: '未检测到高风险违规项，建议人工抽检复核。',
        flags: [
          { label: '暴力', score: 0.08 },
          { label: '色情', score: 0.03 },
          { label: '政治敏感', score: 0.12 }
        ]
      }
    case 'classification':
      return {
        ...common,
        summary: '识别出多个候选标签，按置信度排序。',
        labels: [
          { name: '风景', score: 0.92 },
          { name: '城市', score: 0.63 },
          { name: '人物', score: 0.28 }
        ]
      }
    case 'ocr':
      return {
        ...common,
        summary: '已提取出清晰文本，可复制用于搜索与编辑。',
        text: `示例文本：\n这是一段 OCR 识别的结果示例。\n支持多行文本，包含中英文、数字等。\nOCR (Optical Character Recognition) 可以将图片中的文字提取为可编辑文本。`
      }
    case 'asr':
      return {
        ...common,
        summary: '已完成音频转写，并做了基础标点优化。',
        text: `示例转写：\n大家好，欢迎来到 AI 实验室。本次演示介绍语音识别如何将音频转为文本，并用于检索与摘要。`
      }
    default:
      return { ...common, summary: '暂无可视化结果。' }
  }
}

const openResult = (job: any) => {
  resultJob.value = { ...job }
  resultData.value = getMockResult(job)
  resultVisible.value = true
}
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
    return Math.max(0, pct / 100)
  }
  if (status === 'processing') {
    // 2~10s -> 20~99%
    const procElapsed = Math.max(0, elapsed - 2)
    const pct = Math.floor(20 + Math.min(79, (procElapsed / 8) * 80))
    return Math.min(0.99, Math.max(0.2, pct / 100))
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
const page = ref(1)
const pageSize = ref(10)
const pagedJobs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return jobs.value.slice(start, start + pageSize.value)
})

const columns: TableColumnData[] = [
  { title: '任务ID', dataIndex: 'id', slotName: 'id', align: 'center', titleAlign: 'center' },
  { title: '类型', dataIndex: 'type', slotName: 'type', align: 'center', titleAlign: 'center' },
  { title: '状态', slotName: 'status', align: 'center', titleAlign: 'center' },
  { title: '进度', slotName: 'progress', align: 'center', titleAlign: 'center' },
  // { title: '剩余(秒)', slotName: 'remain' },
  { title: '创建时间', dataIndex: 'createdAt', slotName: 'createdAt', align: 'center', titleAlign: 'center' },
  { title: '操作', slotName: 'actions', align: 'center', titleAlign: 'center' },
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
        <a-card :bordered="false"
          class="group relative shadow-sm hover:shadow-xl transition-all h-full overflow-hidden">
          <div :class="['absolute inset-0 opacity-70 pointer-events-none bg-gradient-to-br', f.gradient]"></div>
          <div class="relative flex items-start justify-between">
            <div class="flex items-start">
              <div class="w-11 h-11 rounded-xl mr-3 flex items-center justify-center ring-4 ring-white shadow-sm"
                :class="f.accent">
                <span class="text-xl">{{ f.emoji }}</span>
              </div>
              <div>
                <div class="font-semibold text-slate-800 group-hover:translate-x-0.5 transition-transform">{{ f.title }}
                </div>
                <div class="text-xs text-slate-500 mt-1">{{ f.desc }}</div>
              </div>
            </div>
            <a-tooltip content="加入任务队列（模拟处理）">
              <a-button type="primary" size="small" :loading="loading"
                class="transition-transform group-hover:scale-[1.02]" @click="enqueue(f.key)">提交任务</a-button>
            </a-tooltip>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <a-card title="任务队列" :bordered="false" class="shadow-sm">
      <template v-if="jobs.length > 0">
        <a-table :data="pagedJobs" :columns="columns"
          :pagination="{ total: jobs.length, current: page, pageSize: pageSize, showTotal: true, showPageSize: true, size: 'small' }"
          @page-change="(p: number) => page = p" @page-size-change="(ps: number) => { pageSize = ps; page = 1 }"
          row-key="id">
          <template #id="{ record }">
            <template v-if="record.status === 'done'">
              <a-link status="success" @click="openResult(record)">{{ record.id }}</a-link>
            </template>
            <template v-else>
              <span class="text-slate-400">{{ record.id }}</span>
            </template>
          </template>
          <template #status="{ record }">
            <a-space>
              <span>{{ statusEmoji(record.status) }}</span>
              <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
            </a-space>
          </template>
          <template #progress="{ record }">
            <a-progress :percent="progressPercent(record.createdAt, record.status)" :show-text="false"
              style="width: 140px" />
          </template>
          <template #createdAt="{ record }">
            {{ formatDate(record.createdAt) }}
          </template>
          <template #type="{ record }">
            {{ typeText(record.type) }}
          </template>
          <template #remain="{ record }">
            {{ remainingSeconds(record.createdAt, record.status) }}
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button v-if="record.status === 'queued' || record.status === 'processing'" size="mini" status="danger"
                @click="cancelJob(record.id)">取消</a-button>
              <a-button v-else size="mini" type="text" status="danger" title="删除"
                @click="deleteJob(record.id)">🗑️</a-button>
            </a-space>
          </template>
        </a-table>
      </template>
      <template v-else>
        <a-empty description="暂无任务，点击上方任意功能卡片提交任务" />
      </template>
    </a-card>

    <!-- 任务结果抽屉 -->
    <a-drawer v-model:visible="resultVisible" :width="680" title="任务结果">
      <div v-if="resultJob && resultData" class="space-y-4">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-slate-500">任务ID：</span><span class="font-mono">{{ resultJob.id }}</span></div>
          <div><span class="text-slate-500">类型：</span>{{ typeText(resultJob.type) }}</div>
          <div><span class="text-slate-500">状态：</span>{{ statusText(resultJob.status) }}</div>
          <div><span class="text-slate-500">创建时间：</span>{{ formatDate(resultJob.createdAt) }}</div>
        </div>
        <a-alert v-if="resultData.summary" type="info" :show-icon="true">{{ resultData.summary }}</a-alert>

        <!-- 按类型展示模拟结果 -->
        <div v-if="resultJob.type === 'thumbnail'">
          <div class="text-slate-600 mb-2">生成的预览尺寸：</div>
          <a-space wrap>
            <a-tag v-for="p in resultData.previews" :key="p" color="arcoblue">{{ p }}</a-tag>
          </a-space>
          <div class="mt-3 grid grid-cols-3 gap-3">
            <div v-for="p in resultData.previews" :key="'box-' + p"
              class="h-20 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-500">预览 {{ p }}
            </div>
          </div>
        </div>

        <div v-else-if="resultJob.type === 'transcode'">
          <div class="text-slate-600 mb-2">输出格式：</div>
          <a-list :bordered="false">
            <a-list-item v-for="o in resultData.outputs" :key="o.format + o.resolution">
              <a-space>
                <a-tag>{{ o.format }}</a-tag>
                <a-tag color="green">{{ o.resolution }}</a-tag>
                <span class="text-slate-500">大小约 {{ o.size }}</span>
              </a-space>
            </a-list-item>
          </a-list>
        </div>

        <div v-else-if="resultJob.type === 'moderation'">
          <div class="text-slate-600 mb-2">审核结果：</div>
          <a-alert type="success" class="mb-2">未发现明显违规内容</a-alert>
          <a-list :bordered="false">
            <a-list-item v-for="f in resultData.flags" :key="f.label">
              <a-space>
                <a-tag :color="f.score > 0.6 ? 'red' : (f.score > 0.3 ? 'orange' : 'green')">{{ f.label }}</a-tag>
                <span class="text-slate-500">置信度 {{ Math.round(f.score * 100) }}%</span>
              </a-space>
            </a-list-item>
          </a-list>
        </div>

        <div v-else-if="resultJob.type === 'classification'">
          <div class="text-slate-600 mb-2">识别标签：</div>
          <a-space wrap>
            <a-tag v-for="c in resultData.labels" :key="c.name" color="arcoblue">{{ c.name }} {{ Math.round(c.score *
              100)
              }}%</a-tag>
          </a-space>
        </div>

        <div v-else-if="resultJob.type === 'ocr'">
          <div class="text-slate-600 mb-2">识别文本：</div>
          <a-typography-paragraph copyable :ellipsis="{ rows: 6 }">{{ resultData.text }}</a-typography-paragraph>
          <a-textarea :model-value="resultData.text" :auto-size="{ minRows: 4, maxRows: 10 }" readonly />
        </div>

        <div v-else-if="resultJob.type === 'asr'">
          <div class="text-slate-600 mb-2">转写文本：</div>
          <a-typography-paragraph copyable :ellipsis="{ rows: 6 }">{{ resultData.text }}</a-typography-paragraph>
          <a-textarea :model-value="resultData.text" :auto-size="{ minRows: 4, maxRows: 10 }" readonly />
        </div>

        <div v-else>
          <a-empty description="暂无结果展示" />
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped></style>
