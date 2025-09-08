<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { 
  IconApps,
  IconFolder,
  IconShareInternal,
  IconEye,
  IconUpload,
  IconSearch,
  IconNotification,
  IconSettings,
  IconUser,
  IconFile,
  IconImage,
  IconVideoCamera,
  IconShareAlt,
  IconFilter,
  IconList,
  IconStar,
  IconDownload,
  IconDelete
} from '@arco-design/web-vue/es/icon';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
});

const fileInput = ref<HTMLInputElement | null>(null);

const currentView = ref('dashboard');
const viewMode = ref('grid');
const searchQuery = ref('');

const mockFiles = ref<any[]>([]);
const aiFeatures = ref<any[]>([]);
const dashboardStats = ref({
  totalFiles: 0,
  imageFiles: 0,
  videoFiles: 0,
  sharedFiles: 0,
});

const fetchFiles = async () => {
  try {
    const response = await apiClient.get('/files', { params: { search: searchQuery.value } });
    mockFiles.value = response.data;
  } catch (error) {
    Message.error('获取文件列表失败');
    console.error(error);
  }
};

const fetchDashboardData = async () => {
  try {
    const [aiRes, statsRes] = await Promise.all([
      apiClient.get('/stats/ai'),
      apiClient.get('/stats/dashboard')
    ]);
    aiFeatures.value = aiRes.data;
    dashboardStats.value = statsRes.data;
  } catch (error) {
    Message.error('获取仪表盘数据失败');
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const file = target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    await apiClient.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    Message.success('文件上传成功！');
    await fetchFiles();
  } catch (error) {
    Message.error('文件上传失败');
  } finally {
    if (target) target.value = '';
  }
};

const handleDownload = (filename: string) => {
  window.open(`http://localhost:3001/api/files/download/${filename}`, '_blank');
};

const handleShare = async (filename: string) => {
  const shareLink = `http://localhost:3001/files/${filename}`;
  try {
    await navigator.clipboard.writeText(shareLink);
    Modal.success({
      title: '分享链接已复制',
      content: `链接: ${shareLink}`,
    });
  } catch (err) {
    Message.error('复制链接失败');
  }
};

const handleDelete = async (filename: string) => {
  try {
    await apiClient.delete(`/files/${filename}`);
    Message.success('文件删除成功！');
    await fetchFiles();
  } catch (error) {
    Message.error('文件删除失败');
  }
};

onMounted(() => {
  fetchFiles();
  fetchDashboardData();
});

const tableColumns = [
  { title: '名称', dataIndex: 'name', slotName: 'name', width: 400 },
  { title: '大小', dataIndex: 'size' },
  { title: '修改时间', dataIndex: 'date' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '操作', slotName: 'actions', align: 'center' }
];

const getStatusTagColor = (status: string) => {
  if (status === '已处理') return 'arcoblue';
  if (status === '处理中') return 'orange';
  return 'red';
};
</script>

<template>
  <!-- 隐藏的文件上传输入框 -->
  <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" />

  <a-layout class="h-screen bg-slate-50">
    <a-layout-sider :width="256" class="!bg-white border-r border-slate-200">
      <div class="flex items-center p-4 h-16 border-b border-slate-200">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-blue-500/30">C</div>
        <h1 class="text-xl font-bold text-slate-800">智能云盘</h1>
      </div>
      <div class="p-4">
        <a-menu :selected-keys="[currentView]" @menu-item-click="(key) => currentView = key as string" :style="{ width: '100%', border: 'none' }">
          <a-menu-item key="dashboard"><template #icon><icon-apps /></template>仪表盘</a-menu-item>
          <a-menu-item key="files"><template #icon><icon-folder /></template>我的文件</a-menu-item>
          <a-menu-item key="shared"><template #icon><icon-share-internal /></template>共享文件</a-menu-item>
          <a-menu-item key="ai"><template #icon><icon-eye /></template>AI分析</a-menu-item>
        </a-menu>
      </div>
      <div class="mt-auto p-6">
        <div class="p-4 bg-slate-100 rounded-lg">
          <h3 class="font-semibold text-slate-800 mb-2 text-sm">存储使用情况</h3>
          <a-progress :percent="75" />
          <p class="text-xs text-slate-500 mt-2">已使用 7.5GB / 10GB</p>
        </div>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="!bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between h-16">
        <div class="flex items-center space-x-4">
          <a-input-search 
            v-model="searchQuery" 
            placeholder="搜索文件..." 
            :style="{ width: '280px' }" 
            @search="fetchFiles" 
            @input="fetchFiles"
            allow-clear
          />
        </div>
        <div class="flex items-center space-x-2">
          <a-button type="primary" @click="triggerFileUpload"><template #icon><icon-upload /></template>上传文件</a-button>
          <a-tooltip content="通知">
            <a-button shape="circle" class="!border-none"><icon-notification /></a-button>
          </a-tooltip>
          <a-tooltip content="设置">
            <a-button shape="circle" class="!border-none"><icon-settings /></a-button>
          </a-tooltip>
          <a-dropdown>
            <a-avatar :size="32" class="cursor-pointer bg-blue-100 text-blue-600">
              <icon-user />
            </a-avatar>
            <template #content>
              <a-doption>个人中心</a-doption>
              <a-doption>退出登录</a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="p-6 overflow-auto">
        <!-- 仪表盘 -->
        <div v-if="currentView === 'dashboard'">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">仪表盘</h2>
          <a-grid :cols="24" :col-gap="24" :row-gap="24" class="mb-8">
            <a-grid-item :span="6">
              <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow">
                <a-statistic title="总文件数" :value="dashboardStats.totalFiles">
                  <template #icon><div class="p-2 bg-blue-100 rounded-md"><icon-file class="text-blue-600"/></div></template>
                </a-statistic>
              </a-card>
            </a-grid-item>
            <a-grid-item :span="6">
              <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow">
                <a-statistic title="图片文件" :value="dashboardStats.imageFiles">
                  <template #icon><div class="p-2 bg-green-100 rounded-md"><icon-image class="text-green-600"/></div></template>
                </a-statistic>
              </a-card>
            </a-grid-item>
            <a-grid-item :span="6">
              <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow">
                <a-statistic title="视频文件" :value="dashboardStats.videoFiles">
                  <template #icon><div class="p-2 bg-orange-100 rounded-md"><icon-video-camera class="text-orange-600"/></div></template>
                </a-statistic>
              </a-card>
            </a-grid-item>
            <a-grid-item :span="6">
              <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-shadow">
                <a-statistic title="共享文件" :value="dashboardStats.sharedFiles">
                  <template #icon><div class="p-2 bg-purple-100 rounded-md"><icon-share-alt class="text-purple-600"/></div></template>
                </a-statistic>
              </a-card>
            </a-grid-item>
          </a-grid>
          <a-grid :cols="2" :col-gap="16" :row-gap="16">
            <a-grid-item>
              <a-card title="AI处理统计">
                <div class="space-y-4">
                  <div v-for="(feature, index) in aiFeatures" :key="index" class="flex items-center justify-between">
                    <div class="flex items-center"><span class="text-2xl mr-3">{{ feature.icon }}</span><span>{{ feature.name }}</span></div>
                    <a-tag color="blue">{{ feature.count }}</a-tag>
                  </div>
                </div>
              </a-card>
            </a-grid-item>
            <a-grid-item>
              <a-card title="最近上传">
                <div class="space-y-3">
                  <div v-for="file in mockFiles.slice(0, 4)" :key="file.id" class="flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="text-2xl mr-3">{{ file.thumbnail }}</span>
                      <div>
                        <p class="text-sm font-medium text-gray-800">{{ file.name }}</p>
                        <p class="text-xs text-gray-500">{{ file.size }} • {{ file.date }}</p>
                      </div>
                    </div>
                    <a-tag :color="getStatusTagColor(file.status)">{{ file.status }}</a-tag>
                  </div>
                </div>
              </a-card>
            </a-grid-item>
          </a-grid>
        </div>

        <!-- 我的文件 -->
        <div v-if="currentView === 'files'">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-slate-800">我的文件</h2>
            <div class="flex items-center space-x-4">
              <a-button><template #icon><icon-filter /></template>筛选</a-button>
              <a-radio-group v-model="viewMode" type="button">
                <a-radio value="grid"><icon-apps /></a-radio>
                <a-radio value="list"><icon-list /></a-radio>
              </a-radio-group>
            </div>
          </div>
          
          <!-- 网格视图 -->
          <a-grid v-if="viewMode === 'grid'" :cols="24" :col-gap="24" :row-gap="24">
            <a-grid-item v-for="file in mockFiles" :key="file.id" :span="{ xs: 12, sm: 8, md: 6 }">
              <a-card :bordered="false" class="shadow-sm hover:shadow-lg transition-all group h-full">
                <div class="flex flex-col h-full">
                  <div class="flex items-start justify-between mb-3">
                    <span class="text-5xl">{{ file.thumbnail }}</span>
                    <a-button shape="circle" type="text" class="opacity-50 group-hover:opacity-100 transition-opacity"><icon-star /></a-button>
                  </div>
                  <h3 class="font-medium text-slate-800 mb-1 truncate">{{ file.name }}</h3>
                  <p class="text-sm text-slate-500 mb-4 flex-grow">{{ file.size }} • {{ file.date }}</p>
                  <div class="flex items-center justify-between">
                    <a-tag :color="getStatusTagColor(file.status)" size="small">{{ file.status }}</a-tag>
                    <a-space class="opacity-0 group-hover:opacity-100 transition-opacity">
                      <a-tooltip content="下载"><a-button size="mini" type="text" @click="handleDownload(file.name)"><icon-download /></a-button></a-tooltip>
                      <a-tooltip content="分享"><a-button size="mini" type="text" @click="handleShare(file.name)"><icon-share-alt /></a-button></a-tooltip>
                      <a-popconfirm content="确定要删除这个文件吗？" @ok="handleDelete(file.name)">
                        <a-tooltip content="删除"><a-button size="mini" type="text" status="danger"><icon-delete /></a-button></a-tooltip>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </div>
              </a-card>
            </a-grid-item>
          </a-grid>

          <!-- 列表视图 -->
          <a-table v-if="viewMode === 'list'" :columns="tableColumns" :data="mockFiles" :pagination="false" row-key="id" class="shadow-sm">
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
                <a-button size="mini" type="text" @click="handleDownload(record.name)"><icon-download /></a-button>
                <a-button size="mini" type="text" @click="handleShare(record.name)"><icon-share-alt /></a-button>
                <a-popconfirm content="确定要删除这个文件吗？" @ok="handleDelete(record.name)">
                  <a-button size="mini" type="text" status="danger"><icon-delete /></a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </div>

        <!-- 其他视图 -->
        <div v-if="currentView === 'shared' || currentView === 'ai'" class="flex items-center justify-center h-full">
          <a-empty description="功能正在开发中..." />
        </div>

      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style lang="postcss">
/* 使用 Tailwind 的 @apply 来定制 Arco 组件，更易于维护 */
.arco-menu-item {
  @apply !rounded-lg !mb-1;
}
.arco-menu-selected, .arco-menu-item:hover {
  @apply !bg-blue-50 text-blue-600;
}
.arco-menu-selected .arco-icon {
  @apply text-blue-600;
}
</style>