<script setup lang="ts">
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold text-slate-800 mb-4">共享中心</h2>
    <a-alert type="info" class="mb-4">在“我的文件”点击“分享”复制的链接，可直接对外访问（由后端静态路径 /files 提供）。</a-alert>
    <a-typography>
      <a-typography-paragraph>1. 前往“我的文件”，点击“分享”复制链接。</a-typography-paragraph>
      <a-typography-paragraph>2. 访问形如 <code>http://localhost:3001/files/文件名</code> 的 URL。</a-typography-paragraph>
    </a-typography>
  </div>
</template>

<style scoped></style>
