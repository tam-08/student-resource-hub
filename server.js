const express = require('express');
const path = require('path');
const multer = require('multer'); // Gọi thư viện multer
const app = express();
const port = 3000;

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

app.listen(port, () => {
    console.log(`🚀 Server đang chạy ngon lành tại: http://localhost:${port}`);
});