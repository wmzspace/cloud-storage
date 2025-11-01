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

const onMenu = (key: string) => {
  if (key === 'profile') Message.info('个人中心（占位）')
  else if (key === 'settings') Message.info('设置（占位）')
  else if (key === 'logout') Message.success('已退出（演示）')
}
</script>

<template>
  <div
    class="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
    <div class="flex items-center gap-3 flex-1">
      <a-input-search v-model="q" placeholder="搜索文件" allow-clear class="flex-1 min-w-[260px] max-w-[420px]"
        @search="goFiles" />
      <a-button type="primary" class="!px-4 bg-gradient-to-r from-indigo-500 to-blue-500 border-0"
        @click="triggerUpload">
        <template #icon><icon-upload /></template>
        上传
      </a-button>
      <input ref="picker" type="file" class="hidden" @change="onPick">
    </div>
    <a-space :size="8" align="center" class="ml-3">
      <a-button shape="circle" type="text"
        class="hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center">
        <icon-notification />
      </a-button>
      <a-divider direction="vertical" />
      <a-dropdown trigger="click" @select="onMenu">
        <a-avatar :size="28" class="ring-1 ring-slate-200 cursor-pointer"><icon-user /></a-avatar>
        <template #content>
          <a-doption value="profile">个人中心</a-doption>
          <a-doption value="settings">设置</a-doption>
          <a-doption value="logout">退出登录</a-doption>
        </template>
      </a-dropdown>
    </a-space>
  </div>
</template>

<style scoped>
.min-w-\[260px\] {
  min-width: 260px;
}

.max-w-\[720px\] {
  max-width: 720px;
}
</style>
