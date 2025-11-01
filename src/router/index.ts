import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/my-files', name: 'files', component: () => import('../views/FilesView.vue') },
  { path: '/shares', name: 'shares', component: () => import('../views/SharesView.vue') },
  { path: '/ai', name: 'ai', component: () => import('../views/AIView.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })
export default router
