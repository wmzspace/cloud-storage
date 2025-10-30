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

const calcDashboardStats = () => {
  const totalFiles = mockFiles.length;
  const imageFiles = mockFiles.filter(f => f.type === 'image').length;
  const videoFiles = mockFiles.filter(f => f.type === 'video').length;
  const sharedFiles = 0; // 如需分享标记可扩展
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

// --- 静态 AI 统计 ---
const aiFeatures = [
  { name: '图像识别', count: 156, icon: '🔍' },
  { name: '文字提取', count: 89, icon: '📝' },
  { name: '语音转文字', count: 34, icon: '🗣️' },
  { name: '内容审核', count: 12, icon: '🛡️' }
];

app.get('/api/stats/ai', (req, res) => {
  res.json(aiFeatures);
});

// --- 简单任务队列（内存占位） ---
let jobs = []; // {id,type,status,createdAt,payload}
const nextId = () => Math.random().toString(36).slice(2, 10)
const advanceStatus = (st) => st === 'queued' ? 'processing' : (st === 'processing' ? 'done' : 'done')

// 任务API
app.get('/api/jobs', (req, res) => {
  res.json(jobs)
})

app.post('/api/jobs', (req, res) => {
  const { type, payload } = req.body || {}
  const job = { id: nextId(), type, status: 'queued', createdAt: new Date().toISOString(), payload }
  jobs.unshift(job)
  res.status(201).json(job)
})

app.patch('/api/jobs/:id', (req, res) => {
  const { id } = req.params
  const j = jobs.find(x => x.id === id)
  if (!j) return res.status(404).json({ message: 'not found' })
  if (req.body?.advance) j.status = advanceStatus(j.status)
  res.json(j)
})

app.listen(port, () => {
  console.log(`后端服务器正在 http://localhost:${port} 上运行`);
});