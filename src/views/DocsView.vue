<script setup lang="ts">
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-800 mb-4">团队与开发计划（原型文档）</h2>
    <a-card class="shadow-sm" :bordered="false">
      <a-typography>
        <a-typography-title :heading="5">一、团队组织</a-typography-title>
        <a-typography-paragraph>前端：Vue3+Arco；后端：Express；算法：占位与接口定义；测试与运维：CI与部署脚本（后续）。</a-typography-paragraph>
        <a-typography-title :heading="5">二、里程碑计划</a-typography-title>
        <a-typography-paragraph>第1周：原型搭建与UI覆盖；第2周：文件系统与分享；第3周：AI流水线接口；第4周：联调与文档/UML。</a-typography-paragraph>
        <a-typography-title :heading="5">三、范围说明</a-typography-title>
        <a-typography-paragraph>当前实现上传/下载/删除/分享、任务队列模拟；AI能力为占位页面与任务。</a-typography-paragraph>
      </a-typography>
    </a-card>
  </div>
  
</template>

<style scoped></style>
