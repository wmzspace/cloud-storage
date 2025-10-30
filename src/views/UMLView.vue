<script setup lang="ts">
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-800 mb-4">UML 设计（原型）</h2>
    <a-grid :cols="2" :col-gap="16" :row-gap="16">
      <a-grid-item>
        <a-card title="用例图（简化）" :bordered="false" class="shadow-sm">
          <pre class="text-xs whitespace-pre-wrap">
参与者：用户、审核员、转码服务、存储服务
用例：上传、下载、分享、浏览、内容审核、转码、OCR、ASR
关系：用户 -> 上传/下载/分享/浏览；转码/审核/识别由任务队列触发
          </pre>
        </a-card>
      </a-grid-item>
      <a-grid-item>
        <a-card title="组件图（简化）" :bordered="false" class="shadow-sm">
          <pre class="text-xs whitespace-pre-wrap">
Web(前端) ──REST── API 网关(Express)
API ──FS── 文件存储(files/)
API ──队列── 任务调度(Job Manager)
任务处理器：缩略图/转码/审核/OCR/ASR(占位)
          </pre>
        </a-card>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<style scoped></style>
