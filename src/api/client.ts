import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

export default api

export const filesApi = {
  list: (search?: string) => api.get('/files', { params: { search } }),
  recent: (limit = 4) => api.get('/files/recent', { params: { limit } }),
  upload: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  remove: (name: string) => api.delete(`/files/${encodeURIComponent(name)}`),
  downloadUrl: (name: string) => `http://localhost:3001/api/files/download/${encodeURIComponent(name)}`,
  shareUrl: (name: string) => `http://localhost:3001/files/${encodeURIComponent(name)}`
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
}
