<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { filesApi, sharesApi } from '../api/client'
import { Message } from '@arco-design/web-vue'

const viewMode = ref<'grid' | 'list'>('grid')
const files = ref<any[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const q = ref<string | undefined>(undefined)
const route = useRoute()

async function load() {
  const res = await filesApi.list(q.value)
  files.value = res.data
}

function getStatusTagColor(status: string) {
  if (status === '已处理') return 'arcoblue'
  if (status === '处理中') return 'orange'
  return 'red'
}

function handleDownload(name: string) {
  window.open(filesApi.downloadUrl(name), '_blank')
}

async function handleDelete(name: string) {
  await filesApi.remove(name)
  await load()
}

async function handleShare(name: string) {
  const link = filesApi.shareUrl(name)
  try {
    // 创建共享记录
    try { await sharesApi.create(name) } catch (e) { /* 忽略重复创建等异常 */ }
    await navigator.clipboard.writeText(link)
    Message.success('已复制分享链接到剪贴板')
  } catch (e) {
    console.warn('复制到剪贴板失败，尝试弹窗显示', e)
    window.prompt('复制以下分享链接', link)
  }
}

async function handleUploadChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  try {
    uploading.value = true
    await filesApi.upload(f)
    await load()
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

onMounted(() => {
  q.value = typeof route.query.q === 'string' ? route.query.q : undefined
  load()
})
watch(() => route.query.q, (nv) => {
  q.value = typeof nv === 'string' ? nv : undefined
  load()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">我的文件</h2>
      <div class="flex items-center flex-wrap justify-end gap-2 md:gap-3">
        <input ref="fileInput" type="file" class="hidden" @change="handleUploadChange" />
        <a-button type="primary" :loading="uploading" @click="fileInput?.click()">上传文件</a-button>
        <div class="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>
        <a-radio-group v-model="viewMode" type="button" class="ml-1 md:ml-2">
          <a-radio value="grid">网格</a-radio>
          <a-radio value="list">列表</a-radio>
        </a-radio-group>
      </div>
    </div>

    <a-grid v-if="viewMode === 'grid'" :cols="24" :col-gap="24" :row-gap="24">
      <a-grid-item v-for="file in files" :key="file.id" :span="6">
        <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-all group h-full">
          <div class="flex flex-col h-full">
            <div class="flex items-start justify-between mb-3">
              <span class="text-5xl">{{ file.thumbnail }}</span>
            </div>
            <h3 class="font-medium text-slate-800 mb-1 truncate">{{ file.name }}</h3>
            <p class="text-sm text-slate-500 mb-4 flex-grow">{{ file.size }} • {{ file.date }}</p>
            <div class="flex items-center justify-between">
              <a-tag :color="getStatusTagColor(file.status)" size="small">{{ file.status }}</a-tag>
              <a-space class="opacity-0 group-hover:opacity-100 transition-opacity">
                <a-button size="mini" type="text" @click="handleDownload(file.name)">下载</a-button>
                <a-button size="mini" type="text" @click="handleShare(file.name)">分享</a-button>
                <a-popconfirm content="确定要删除这个文件吗？" @ok="handleDelete(file.name)">
                  <a-button size="mini" type="text" status="danger">删除</a-button>
                </a-popconfirm>
              </a-space>
            </div>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>

    <a-table v-else :columns="[
      { title: '名称', dataIndex: 'name', slotName: 'name', width: 400 },
      { title: '大小', dataIndex: 'size' },
      { title: '修改时间', dataIndex: 'date' },
      { title: '状态', dataIndex: 'status', slotName: 'status' },
      { title: '操作', slotName: 'actions', align: 'center' }
    ]" :data="files" :pagination="false" row-key="id" class="shadow-sm">
      <template #name="{ record }">
        <div class="flex items-center">
          <span class="text-2xl mr-3">{{ record.thumbnail }}</span>
          <span>{{ record.name }}</span>
        </div>
      </template>
      <template #status="{ record }">
        <a-tag :color="getStatusTagColor(record.status)">{{ record.status }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="mini" type="text" @click="handleDownload(record.name)">下载</a-button>
          <a-button size="mini" type="text" @click="handleShare(record.name)">分享</a-button>
          <a-popconfirm content="确定要删除这个文件吗？" @ok="handleDelete(record.name)">
            <a-button size="mini" type="text" status="danger">删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<style scoped></style>
