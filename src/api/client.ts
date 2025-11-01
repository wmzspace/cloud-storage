import axios from 'axios'

// 动态推断后端地址：
// - 开发环境：通过 Vite 代理，直接使用相对路径 '/api' 和 '/files'
// - 生产环境或未配置代理：使用同域主机 + 端口（默认 3001）或 VITE_API_ORIGIN/VITE_API_PORT
const env: any = (import.meta as any)?.env || {}
const isDev = !!env?.DEV
const originFromEnv = env?.VITE_API_ORIGIN as string | undefined
const portFromEnv = env?.VITE_API_PORT as string | undefined
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
const apiOrigin = originFromEnv || `${protocol}//${host}:${portFromEnv || '3001'}`

// 统一定义 API 与静态文件基址（开发为相对路径，生产为绝对路径）
const apiBase = isDev ? '/api' : `${apiOrigin}/api`
const filesBase = isDev ? '/files' : `${apiOrigin}/files`

const api = axios.create({ baseURL: apiBase })

// 简单的错误日志，便于定位网络/端口/跨域问题
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url
    console.warn('[api error]', status, url, err?.message)
    return Promise.reject(err)
  }
)

export default api

export const filesApi = {
  list: (search?: string) => api.get('/files', { params: { search } }),
  recent: (limit = 4) => api.get('/files/recent', { params: { limit } }),
  upload: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  remove: (name: string) => api.delete(`/files/${encodeURIComponent(name)}`),
  // 下载接口走 /api，分享直链走 /files 静态目录
  downloadUrl: (name: string) => `${apiBase}/files/download/${encodeURIComponent(name)}`,
  shareUrl: (name: string) => `${filesBase}/${encodeURIComponent(name)}`
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  storage: () => api.get('/stats/storage'),
  ai: () => api.get('/stats/ai'),
}

export const jobsApi = {
  list: () => api.get('/jobs'),
  create: (type: string, payload: any) => api.post('/jobs', { type, payload }),
  update: (id: string, patch: any) => api.patch(`/jobs/${id}`, patch),
  cancel: (id: string) => api.patch(`/jobs/${id}`, { cancel: true }),
  remove: (id: string) => api.delete(`/jobs/${encodeURIComponent(id)}`),
}
