<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { jobsApi } from '../api/client'
import { Message } from '@arco-design/web-vue'

const jobs = ref<any[]>([])
const load = async () => { jobs.value = (await jobsApi.list()).data }
const enqueue = async (type: string) => {
  await jobsApi.create(type, { note: 'demo' }); Message.success('已加入队列'); await load()
}

type Feature = { key: string; title: string; desc: string; emoji: string; bg: string }
const features: Feature[] = [
  { key: 'thumbnail', title: '图像缩略图', desc: '生成预览图（模拟）', emoji: '🖼️', bg: '#eff6ff' },
  { key: 'transcode', title: '视频转码', desc: 'H.264/H.265（模拟）', emoji: '🎞️', bg: '#fff7ed' },
  { key: 'moderation', title: '图片审核', desc: '敏感信息检测（模拟）', emoji: '🛡️', bg: '#f5f3ff' },
  { key: 'classification', title: '图片分类', desc: '内容识别与分类（模拟）', emoji: '🏷️', bg: '#ecfeff' },
  { key: 'ocr', title: '图片文字识别（OCR）', desc: '提取图片文字（模拟）', emoji: '🔤', bg: '#f0fdf4' },
  { key: 'asr', title: '语音识别（ASR）', desc: '音频转写文本（模拟）', emoji: '🎤', bg: '#fef2f2' },
]

onMounted(load)
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-800 mb-4">AI 实验室</h2>

    <a-grid :cols="24" :col-gap="16" :row-gap="16" class="mb-6">
      <a-grid-item v-for="f in features" :key="f.key" :span="{ xs: 24, sm: 12, md: 12, lg: 8 }">
        <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-all h-full">
          <div class="flex items-start justify-between">
            <div class="flex items-start">
              <div class="w-10 h-10 rounded-xl mr-3 flex items-center justify-center" :style="{ backgroundColor: f.bg }">
                <span class="text-xl">{{ f.emoji }}</span>
              </div>
              <div>
                <div class="font-semibold text-slate-800">{{ f.title }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ f.desc }}</div>
              </div>
            </div>
            <a-button type="primary" size="small" @click="enqueue(f.key)">提交任务</a-button>
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
