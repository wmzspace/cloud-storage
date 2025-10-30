<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { jobsApi } from '../api/client'
import { Message } from '@arco-design/web-vue'

const jobs = ref<any[]>([])
const load = async () => { jobs.value = (await jobsApi.list()).data }
const advance = async (id: string) => { await jobsApi.update(id, { advance: true }); Message.success('状态已推进'); await load() }
onMounted(load)
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-800 mb-4">任务队列</h2>
    <a-alert class="mb-4" type="info">该队列模拟后端任务状态流转：queued → processing → done。</a-alert>
    <a-table :data="jobs" :pagination="false" row-key="id" class="shadow-sm">
      <a-table-column title="任务ID" data-index="id" />
      <a-table-column title="类型" data-index="type" />
      <a-table-column title="状态" data-index="status" />
      <a-table-column title="创建时间" data-index="createdAt" />
      <a-table-column title="操作">
        <template #cell="{ record }">
          <a-button size="mini" @click="advance(record.id)">推进一次状态</a-button>
        </template>
      </a-table-column>
    </a-table>
  </div>
</template>

<style scoped></style>
