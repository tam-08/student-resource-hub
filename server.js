const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const multer = require('multer'); // Gọi thư viện multer

// Cấu hình Multer: Chỉ định nơi lưu file và giữ nguyên tên file gốc
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

app.use(express.static(__dirname));
app.use(express.json()); // <--- BẠN THÊM DÒNG NÀY

// Đường dẫn trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Cổng API (Đường hầm) để nhận file từ giao diện gửi xuống
app.post('/api/upload', upload.single('myFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Không tìm thấy file nào được tải lên.');
    }
    console.log(`📥 Đã lưu thành công file: ${req.file.originalname}`);
    res.send({ message: 'Tải file thành công!', filename: req.file.originalname });
});

// --- API ĐĂNG KÝ TÀI KHOẢN ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const usersFile = path.join(__dirname, 'users.json');

    // Đọc file users.json
    fs.readFile(usersFile, 'utf8', (err, data) => {
        let users = [];
        if (!err && data) users = JSON.parse(data); // Dịch data thành mảng JS

        // Kiểm tra xem tên đăng nhập có bị trùng không
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ message: 'Tên đăng nhập đã có người sử dụng!' });
        }

        // Thêm user mới vào mảng và ghi lại vào ổ cứng
        users.push({ username, password });
        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).json({ message: 'Lỗi máy chủ khi lưu tài khoản.' });
            res.json({ message: 'Đăng ký thành công! Hãy đăng nhập.' });
        });
    });
});

// --- API ĐĂNG NHẬP ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const usersFile = path.join(__dirname, 'users.json');

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err || !data) return res.status(400).json({ message: 'Hệ thống chưa có tài khoản nào.' });
        
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            res.json({ message: 'Đăng nhập thành công!', username: user.username });
        } else {
            res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
    });
});

app.listen(port, () => {
    // --- API LẤY DANH SÁCH FILE ĐÃ TẢI LÊN ---
    app.get('/api/files', (req, res) => {
        const uploadDir = path.join(__dirname, 'uploads'); // Trỏ đường dẫn vào thư mục uploads

        // Yêu cầu Node.js đọc nội dung trong thư mục đó
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error("Lỗi đọc thư mục:", err);
                return res.status(500).send('Không thể đọc thư mục file.');
            }

            // Node.js đọc xong sẽ đóng gói danh sách tên file thành mảng JSON gửi về
            res.json(files);
        });
    });
    console.log(`🚀 Server đang chạy ngon lành tại: http://localhost:${port}`);
});