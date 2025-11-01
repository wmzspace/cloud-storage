<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sharesApi, filesApi } from '../api/client'
import { Message } from '@arco-design/web-vue'

const loading = ref(false)
const items = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const res = await sharesApi.list()
    items.value = res.data
  } finally {
    loading.value = false
  }
}

const copy = async (name: string) => {
  const link = filesApi.shareUrl(name)
  try {
    await navigator.clipboard.writeText(link)
    Message.success('已复制分享链接')
  } catch (e) {
    window.prompt('复制以下分享链接', link)
  }
}

const openLink = (name: string) => {
  window.open(filesApi.shareUrl(name), '_blank')
}

const unshare = async (name: string) => {
  await sharesApi.remove(name)
  Message.success('已取消共享')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-4">共享中心</h2>
    <a-alert type="info" class="mb-4">在“我的文件”点击“分享”后将出现在这里，可复制链接或取消共享。</a-alert>

    <a-table :data="items" :pagination="false" :loading="loading" row-key="name" class="shadow-sm" :columns="[
      { title: '名称', dataIndex: 'name', slotName: 'name', width: 400 },
      { title: '大小', dataIndex: 'size' },
      { title: '修改时间', dataIndex: 'date' },
      { title: '操作', slotName: 'actions', align: 'center' }
    ]">
      <template #name="{ record }">
        <div class="flex items-center">
          <span class="text-2xl mr-3">{{ record.thumbnail }}</span>
          <span class="truncate">{{ record.name }}</span>
        </div>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="mini" type="text" @click="copy(record.name)">复制链接</a-button>
          <a-button size="mini" type="text" @click="openLink(record.name)">打开</a-button>
          <a-popconfirm content="确定要取消共享吗？" @ok="unshare(record.name)">
            <a-button size="mini" type="text" status="danger">取消共享</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>
  </div>
</template>

<style scoped></style>
