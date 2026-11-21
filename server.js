const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// --- KHỞI TẠO THƯ MỤC & DATABASE JSON ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const filesDbPath = path.join(__dirname, 'files.json');
const usersDbPath = path.join(__dirname, 'users.json');

function readJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- CẤU HÌNH MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ================= API TÀI KHOẢN =================

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersDbPath);

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Tên đăng nhập đã có người sử dụng!' });
    }

    users.push({ username, password });
    writeJSON(usersDbPath, users);
    res.json({ message: 'Đăng ký thành công! Hãy đăng nhập.' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersDbPath);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ message: 'Đăng nhập thành công!', username: user.username });
    } else {
        res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }
});

app.put('/api/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const users = readJSON(usersDbPath);
    const user = users.find(u => u.username === username && u.password === oldPassword);

    if (!user) {
        return res.status(400).json({ message: 'Mật khẩu cũ không chính xác!' });
    }

    user.password = newPassword;
    writeJSON(usersDbPath, users);
    res.json({ message: 'Đổi mật khẩu thành công!' });
});

// ================= API QUẢN LÝ FILE =================

app.post('/api/upload', upload.single('myFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Chưa chọn file!' });

    const owner = req.body.owner || 'unknown';
    const files = readJSON(filesDbPath);

    const newFile = {
        id: Date.now().toString(),
        fileName: req.file.filename,
        displayName: req.file.originalname,
        owner,
        isFavorite: false,
        isTrash: false,
        sharedWith: []
    };

    files.push(newFile);
    writeJSON(filesDbPath, files);
    res.json({ message: 'Tải file lên thành công!', file: newFile });
});

app.get('/api/files', (req, res) => {
    res.json(readJSON(filesDbPath));
});

app.put('/api/files/:id/favorite', (req, res) => {
    const files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ message: 'Không tìm thấy file!' });

    file.isFavorite = !file.isFavorite;
    writeJSON(filesDbPath, files);
    res.json({ message: 'Đã cập nhật yêu thích!', file });
});

app.put('/api/files/:id/rename', (req, res) => {
    const { newName } = req.body;
    const files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ message: 'Không tìm thấy file!' });

    file.displayName = newName;
    writeJSON(filesDbPath, files);
    res.json({ message: 'Đổi tên thành công!', file });
});

app.put('/api/files/:id/trash', (req, res) => {
    const files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ message: 'Không tìm thấy file!' });

    file.isTrash = !file.isTrash;
    writeJSON(filesDbPath, files);
    res.json({ message: file.isTrash ? 'Đã chuyển vào thùng rác!' : 'Đã khôi phục tài liệu!', file });
});

app.delete('/api/files/:id', (req, res) => {
    let files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ message: 'Không tìm thấy file!' });

    const filePath = path.join(uploadDir, file.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    files = files.filter(f => f.id !== req.params.id);
    writeJSON(filesDbPath, files);
    res.json({ message: 'Đã xóa vĩnh viễn tài liệu!' });
});

app.put('/api/files/:id/share', (req, res) => {
    const { targetUser } = req.body;
    const users = readJSON(usersDbPath);

    if (!users.find(u => u.username === targetUser)) {
        return res.status(404).json({ message: `Không tìm thấy tài khoản "${targetUser}"!` });
    }

    const files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ message: 'Không tìm thấy file!' });

    if (file.owner === targetUser) {
        return res.status(400).json({ message: 'Không thể tự chia sẻ cho chính mình!' });
    }

    if (!file.sharedWith.includes(targetUser)) {
        file.sharedWith.push(targetUser);
        writeJSON(filesDbPath, files);
    }

    res.json({ message: `Đã chia sẻ tài liệu cho ${targetUser}!` });
});

// --- API TẢI FILE VỀ MÁY ---
app.get('/api/files/:id/download', (req, res) => {
    const files = readJSON(filesDbPath);
    const file = files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).send('Không tìm thấy file!');

    const filePath = path.join(uploadDir, file.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).send('File không còn tồn tại trên server!');

    // Ép trình duyệt tải xuống với đúng tên hiển thị (displayName)
    res.download(filePath, file.displayName);
});

app.listen(port, () => {
    console.log(`🚀 Server đang chạy ngon lành tại: http://localhost:${port}`);
});