<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { jobsApi } from '../api/client'
import { Message, Tooltip as ATooltip } from '@arco-design/web-vue'

const jobs = ref<any[]>([])
const loading = ref(false)
const load = async () => { jobs.value = (await jobsApi.list()).data }
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

type Feature = { key: string; title: string; desc: string; emoji: string; gradient: string; accent: string }
const features: Feature[] = [
  { key: 'thumbnail', title: '图像缩略图', desc: '生成预览图（模拟）', emoji: '🖼️', gradient: 'from-blue-50 to-indigo-50', accent: 'bg-blue-200' },
  { key: 'transcode', title: '视频转码', desc: 'H.264/H.265（模拟）', emoji: '🎞️', gradient: 'from-amber-50 to-orange-50', accent: 'bg-amber-200' },
  { key: 'moderation', title: '图片审核', desc: '敏感信息检测（模拟）', emoji: '🛡️', gradient: 'from-violet-50 to-fuchsia-50', accent: 'bg-violet-200' },
  { key: 'classification', title: '图片分类', desc: '内容识别与分类（模拟）', emoji: '🏷️', gradient: 'from-cyan-50 to-teal-50', accent: 'bg-cyan-200' },
  { key: 'ocr', title: '图片文字识别（OCR）', desc: '提取图片文字（模拟）', emoji: '🔤', gradient: 'from-emerald-50 to-green-50', accent: 'bg-emerald-200' },
  { key: 'asr', title: '语音识别（ASR）', desc: '音频转写文本（模拟）', emoji: '🎤', gradient: 'from-rose-50 to-pink-50', accent: 'bg-rose-200' },
]

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-4">AI 实验室</h2>

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
      <a-table :data="jobs" :pagination="false" row-key="id">
        <a-table-column title="任务ID" data-index="id" />
        <a-table-column title="类型" data-index="type" />
        <a-table-column title="状态" data-index="status" />
        <a-table-column title="创建时间" data-index="createdAt" />
      </a-table>
    </a-card>
  </div>
</template>

<style scoped></style>
