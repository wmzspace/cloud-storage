// filepath: main.tsx
import { createApp } from 'vue'
import App from './智能云盘系统原型.vue' // 我们将创建这个 .vue 文件
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import './index.css'; // 保留 Tailwind CSS

const app = createApp(App);
app.use(ArcoVue);
app.mount('#root');