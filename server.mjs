import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;

// --- 路径和目录设置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filesDir = path.join(__dirname, 'files');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const jobsFile = path.join(dataDir, 'jobs.json');
const sharesFile = path.join(dataDir, 'shares.json');

// 确保 files 目录存在
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

// Multer 配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    // 防止文件名乱码，并添加时间戳以避免重名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${uniqueSuffix}-${originalName}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/files', express.static(filesDir));

// --- 动态文件元数据与统计 ---
let mockFiles = []; // 动态加载
let shares = new Set(); // 共享文件名集合（持久化于 data/shares.json）

const getFileThumbnail = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return '📸';
  if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return '🎥';
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'].includes(ext)) return '📄';
  if (['.mp3', '.wav', '.aac', '.flac'].includes(ext)) return '🎵';
  return '📝';
};

const getFileType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.aac', '.flac'].includes(ext)) return 'audio';
  return 'document';
};

const loadFilesFromDisk = () => {
  try {
    const filesOnDisk = fs.readdirSync(filesDir);
    mockFiles = filesOnDisk
      .map((fileName) => {
        const full = path.join(filesDir, fileName);
        const stats = fs.statSync(full);
        return {
          id: stats.ino,
          name: fileName,
          type: getFileType(fileName),
          sizeBytes: stats.size,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          date: stats.mtime.toISOString().split('T')[0],
          mtimeMs: stats.mtimeMs,
          thumbnail: getFileThumbnail(fileName),
          status: '已处理'
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs); // 最近在前
  } catch (error) {
    console.error('从磁盘加载文件失败:', error);
    mockFiles = [];
  }
};

// --- 共享/任务 持久化 ---
const loadSharesFromStore = () => {
  try {
    if (fs.existsSync(sharesFile)) {
      const raw = fs.readFileSync(sharesFile, 'utf-8')
      const arr = JSON.parse(raw)
      shares = new Set(Array.isArray(arr) ? arr : [])
    } else {
      shares = new Set()
    }
  } catch (e) {
    console.warn('加载共享列表失败，使用空集合', e)
    shares = new Set()
  }
}
const saveSharesToStore = () => {
  try {
    fs.writeFileSync(sharesFile, JSON.stringify(Array.from(shares), null, 2))
  } catch (e) {
    console.warn('保存共享列表失败', e)
  }
}

const calcDashboardStats = () => {
  const totalFiles = mockFiles.length;
  const imageFiles = mockFiles.filter(f => f.type === 'image').length;
  const videoFiles = mockFiles.filter(f => f.type === 'video').length;
  // 仅统计当前存在于磁盘的共享文件数量
  const sharedFiles = Array.from(shares).filter((name) => fs.existsSync(path.join(filesDir, name))).length;
  return { totalFiles, imageFiles, videoFiles, sharedFiles };
};

const calcStorage = () => {
  // 设定容量为 10GB，可按需改成环境变量
  const capacityBytes = 10 * 1024 * 1024 * 1024;
  const usedBytes = mockFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
  const usedPercent = capacityBytes === 0 ? 0 : Math.min(100, Math.round((usedBytes / capacityBytes) * 100));
  return { usedBytes, capacityBytes, usedPercent };
};

loadFilesFromDisk();
loadSharesFromStore();
// 注意：加载任务必须在 jobs 变量初始化后再调用，调用位置已下移

// --- API 端点 ---

// 获取文件列表（支持搜索）
app.get('/api/files', (req, res) => {
  loadFilesFromDisk();
  const { search } = req.query;
  if (search) {
    const s = String(search).toLowerCase();
    return res.json(mockFiles.filter(file => file.name.toLowerCase().includes(s)));
  }
  res.json(mockFiles);
});

// 共享管理 API
app.get('/api/shares', (req, res) => {
  loadFilesFromDisk();
  const list = Array.from(shares).map((name) => {
    const f = mockFiles.find(x => x.name === name);
    return {
      name,
      size: f?.size || '',
      date: f?.date || '',
      thumbnail: f?.thumbnail || '📄',
      type: f?.type || 'document',
      url: `${req.protocol}://${req.get('host')}/files/${encodeURIComponent(name)}`,
    };
  });
  res.json(list);
});

app.post('/api/shares', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name required' });
  const filePath = path.join(filesDir, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'file not found' });
  shares.add(name);
  saveSharesToStore();
  res.status(201).json({ message: 'shared', name });
});

app.delete('/api/shares/:name', (req, res) => {
  const { name } = req.params;
  if (!shares.has(name)) return res.status(404).json({ message: 'not found' });
  shares.delete(name);
  saveSharesToStore();
  res.json({ message: 'unshared', name });
});

// 最近上传
app.get('/api/files/recent', (req, res) => {
  loadFilesFromDisk();
  const limit = Number(req.query.limit || 4);
  res.json(mockFiles.slice(0, limit));
});

// 上传文件
app.post('/api/files', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('没有上传文件');
  loadFilesFromDisk();
  res.status(201).json({ message: '文件上传成功', file: req.file });
});

// 下载文件
app.get('/api/files/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(filesDir, filename);
  if (fs.existsSync(filePath)) return res.download(filePath);
  res.status(404).send('文件未找到');
});

// 删除文件
app.delete('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(filesDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: '文件未找到' });
  fs.unlinkSync(filePath);
  // 若该文件在共享列表中，顺便取消共享
  if (shares.has(filename)) {
    shares.delete(filename);
    saveSharesToStore();
  }
  loadFilesFromDisk();
  res.status(200).json({ message: '文件删除成功' });
});

// 仪表盘统计（动态）
app.get('/api/stats/dashboard', (req, res) => {
  loadFilesFromDisk();
  res.json(calcDashboardStats());
});

// 存储统计（动态）
app.get('/api/stats/storage', (req, res) => {
  loadFilesFromDisk();
  res.json(calcStorage());
});

// --- AI 统计：根据任务队列动态汇总 ---
app.get('/api/stats/ai', (req, res) => {
  const mapping = [
    { type: 'thumbnail', name: '图像缩略图', icon: '🖼️' },
    { type: 'transcode', name: '视频转码', icon: '🎞️' },
    { type: 'moderation', name: '图片审核', icon: '�️' },
    { type: 'classification', name: '图片分类', icon: '🏷️' },
    { type: 'ocr', name: '文字提取', icon: '�' },
    { type: 'asr', name: '语音转文字', icon: '�️' }
  ]
  const result = mapping.map(m => ({
    name: m.name,
    icon: m.icon,
    count: jobs.filter(j => j.type === m.type).length
  }))
  res.json(result)
});

// --- 简单任务队列（内存占位） ---
let jobs = []; // {id,type,status,createdAt,payload}（持久化于 data/jobs.json）
const jobTimers = new Map(); // id -> { toProcessing, toDone }
const nextId = () => Math.random().toString(36).slice(2, 10)
const advanceStatus = (st) => st === 'queued' ? 'processing' : (st === 'processing' ? 'done' : 'done')

function scheduleJobTimers(job) {
  // 2秒后进入 processing，10秒后完成 done
  const toProcessing = setTimeout(() => {
    const j = jobs.find(x => x.id === job.id)
    if (!j || j.status !== 'queued') return
    j.status = 'processing'
    saveJobsToStore()
  }, 2000)
  const toDone = setTimeout(() => {
    const j = jobs.find(x => x.id === job.id)
    if (!j || (j.status === 'done' || j.status === 'canceled')) return
    j.status = 'done'
    clearJobTimers(job.id)
    saveJobsToStore()
  }, 10000)
  jobTimers.set(job.id, { toProcessing, toDone })
}

function clearJobTimers(id) {
  const timers = jobTimers.get(id)
  if (timers) {
    clearTimeout(timers.toProcessing)
    clearTimeout(timers.toDone)
    jobTimers.delete(id)
  }
}

function saveJobsToStore() {
  try {
    fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2))
  } catch (e) {
    console.warn('保存任务列表失败', e)
  }
}

function loadJobsFromStoreAndRecover() {
  try {
    if (fs.existsSync(jobsFile)) {
      const raw = fs.readFileSync(jobsFile, 'utf-8')
      const arr = JSON.parse(raw)
      jobs = Array.isArray(arr) ? arr : []
    } else {
      jobs = []
    }
  } catch (e) {
    console.warn('加载任务列表失败，使用空列表', e)
    jobs = []
  }

  // 恢复计时器/状态：根据 createdAt 与当前时间推断
  const now = Date.now()
  for (const j of jobs) {
    if (j.status === 'done' || j.status === 'canceled') { clearJobTimers(j.id); continue }
    const t0 = new Date(j.createdAt).getTime()
    const elapsed = (now - t0) / 1000
    if (elapsed >= 10) {
      j.status = 'done'
      clearJobTimers(j.id)
    } else if (elapsed >= 2) {
      j.status = 'processing'
      const toDoneMs = Math.max(0, (10 - elapsed) * 1000)
      const toDone = setTimeout(() => {
        const jj = jobs.find(x => x.id === j.id)
        if (!jj || jj.status === 'done' || jj.status === 'canceled') return
        jj.status = 'done'
        clearJobTimers(j.id)
        saveJobsToStore()
      }, toDoneMs)
      jobTimers.set(j.id, { toProcessing: setTimeout(() => { }, 0), toDone })
    } else {
      const toProcMs = Math.max(0, (2 - elapsed) * 1000)
      const toDoneMs = Math.max(0, (10 - elapsed) * 1000)
      const toProcessing = setTimeout(() => {
        const jj = jobs.find(x => x.id === j.id)
        if (!jj || jj.status !== 'queued') return
        jj.status = 'processing'
        saveJobsToStore()
      }, toProcMs)
      const toDone = setTimeout(() => {
        const jj = jobs.find(x => x.id === j.id)
        if (!jj || jj.status === 'done' || jj.status === 'canceled') return
        jj.status = 'done'
        clearJobTimers(j.id)
        saveJobsToStore()
      }, toDoneMs)
      jobTimers.set(j.id, { toProcessing, toDone })
    }
  }
  // 保存一次可能的状态修正
  saveJobsToStore()
}

// 初始化加载已持久化的任务并恢复调度
loadJobsFromStoreAndRecover();

// 任务API
app.get('/api/jobs', (req, res) => {
  const sorted = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(sorted)
})

app.post('/api/jobs', (req, res) => {
  const { type, payload } = req.body || {}
  const job = { id: nextId(), type, status: 'queued', createdAt: new Date().toISOString(), payload }
  jobs.unshift(job)
  scheduleJobTimers(job)
  saveJobsToStore()
  res.status(201).json(job)
})

app.patch('/api/jobs/:id', (req, res) => {
  const { id } = req.params
  const j = jobs.find(x => x.id === id)
  if (!j) return res.status(404).json({ message: 'not found' })
  if (req.body?.cancel) {
    j.status = 'canceled'
    clearJobTimers(id)
  } else if (req.body?.advance) {
    j.status = advanceStatus(j.status)
    if (j.status === 'done') clearJobTimers(id)
  }
  saveJobsToStore()
  res.json(j)
})

// 删除任务（支持前端 DELETE）
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params
  const idx = jobs.findIndex(x => x.id === id)
  if (idx === -1) return res.status(404).json({ message: 'not found' })
  // 清理定时器并从数组中移除
  clearJobTimers(id)
  const removed = jobs.splice(idx, 1)[0]
  saveJobsToStore()
  res.json({ message: 'deleted', job: removed })
})

app.listen(port, () => {
  console.log(`后端服务器正在 http://localhost:${port} 上运行`);
});