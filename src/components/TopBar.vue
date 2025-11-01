<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { filesApi } from '../api/client'
import { Message } from '@arco-design/web-vue'
import { IconUpload, IconNotification, IconUser } from '@arco-design/web-vue/es/icon'
const q = ref('')
const router = useRouter()
const picker = ref<HTMLInputElement | null>(null)
const triggerUpload = () => picker.value?.click()
const onPick = async (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  await filesApi.upload(f)
  Message.success('上传成功')
    ; (e.target as HTMLInputElement).value = ''
  router.push('/my-files')
}
const goFiles = () => router.push({ path: '/my-files', query: { q: q.value } })
</script>

<template>
  <div class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <a-input-search v-model="q" placeholder="搜索文件..." :style="{ width: '320px' }" allow-clear @search="goFiles" />
      <a-button type="primary" @click="triggerUpload"><template #icon><icon-upload /></template>上传</a-button>
      <input ref="picker" type="file" class="hidden" @change="onPick">
    </div>
    <a-space :size="12" align="center">
      <a-button shape="circle" type="text" class="hover:bg-slate-100 rounded-full">
        <icon-notification />
      </a-button>
      <a-avatar :size="28" class="ring-1 ring-slate-200"><icon-user /></a-avatar>
    </a-space>
  </div>
</template>

<style scoped></style>
