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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${uniqueSuffix}-${originalName}`);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
// 提供静态文件访问，用于分享链接
app.use('/files', express.static(filesDir));

// --- 模拟数据库 ---
let mockFiles = []; // 我们将从文件目录动态加载

const getFileThumbnail = (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return '📸';
    if (['.mp4', '.avi', '.mov'].includes(ext)) return '🎥';
    if (['.pdf', '.doc', '.docx'].includes(ext)) return '📄';
    if (['.mp3', '.wav'].includes(ext)) return '🎵';
    return '📝';
};


const loadFilesFromDisk = () => {
    try {
        const filesOnDisk = fs.readdirSync(filesDir);
        mockFiles = filesOnDisk.map((fileName, index) => {
            const stats = fs.statSync(path.join(filesDir, fileName));
            return {
                id: stats.ino, // 使用 inode 作为唯一 ID
                name: fileName,
                size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                date: stats.mtime.toISOString().split('T')[0],
                thumbnail: getFileThumbnail(fileName),
                status: '已处理'
            };
        });
    } catch (error) {
        console.error("从磁盘加载文件失败:", error);
        mockFiles = [];
    }
};

loadFilesFromDisk(); // 初始化

// --- API 端点 ---

// 获取文件列表（支持搜索）
app.get('/api/files', (req, res) => {
  loadFilesFromDisk(); // 每次请求都重新加载，确保数据最新
  const { search } = req.query;
  if (search) {
    const filteredFiles = mockFiles.filter(file => 
      file.name.toLowerCase().includes(String(search).toLowerCase())
    );
    return res.json(filteredFiles);
  }
  res.json(mockFiles);
});

// 上传文件
app.post('/api/files', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('没有上传文件');
  }
  loadFilesFromDisk(); // 重新加载文件列表
  res.status(201).json({ message: '文件上传成功', file: req.file });
});

// 下载文件
app.get('/api/files/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(filesDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath); // 触发浏览器下载
    } else {
        res.status(404).send('文件未找到');
    }
});

// 删除文件
app.delete('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(filesDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    loadFilesFromDisk(); // 重新加载
    res.status(200).json({ message: '文件删除成功' });
  } else {
    res.status(404).json({ message: '文件未找到' });
  }
});

// --- 静态统计数据端点 ---
const aiFeatures = [
  { name: '图像识别', count: 156, icon: '🔍' },
  { name: '文字提取', count: 89, icon: '📝' },
  { name: '语音转文字', count: 34, icon: '🗣️' },
  { name: '内容审核', count: 12, icon: '🛡️' }
];

const dashboardStats = {
  totalFiles: 1234,
  imageFiles: 456,
  videoFiles: 89,
  sharedFiles: 67,
};
app.get('/api/stats/dashboard', (req, res) => {
  res.json(dashboardStats);
});
app.get('/api/stats/ai', (req, res) => {
  res.json(aiFeatures);
});


app.listen(port, () => {
  console.log(`后端服务器正在 http://localhost:${port} 上运行`);
});