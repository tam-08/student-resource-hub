const menuItems = document.querySelectorAll('.nav-menu li');
const contentSelection = document.querySelectorAll('.content-section');
menuItems.forEach(item => {
    item.addEventListener('click', function () {
        menuItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        contentSelection.forEach(section => {
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(targetId);
        if (targetId) {
            targetSection.style.display = 'block';
        }
    });
});

const btnUpload = document.getElementById('btn-upload');
const fileInput = document.getElementById('file-input');
btnUpload.addEventListener('click', () => {
    fileInput.click();
});
fileInput.addEventListener('change', function () {
    const selectedFile = this.files[0];
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('myFile', selectedFile);
    fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            alert('🎉 ' + data.message);
            fileInput.value = '';
            loadFiles();
        })
        .catch(error => {
            console.error('Lỗi tải file:', error);
            alert('❌ Có lỗi xảy ra khi tải file!');
        });
});

// --- CHỨC NĂNG TẢI DANH SÁCH FILE ĐỘNG ---
const fileGrid = document.getElementById('file-grid');

function loadFiles() {
    fetch('http://localhost:3000/api/files')
        .then(response => response.json())
        .then(files => {
            // Xóa nội dung cũ
            fileGrid.innerHTML = '';

            // Nếu thư mục rỗng
            if (files.length === 0) {
                fileGrid.innerHTML = '<p>Chưa có tài liệu nào. Hãy tải lên!</p>';
                return;
            }

            // Lặp qua từng tên file và vẽ ra giao diện
            files.forEach(fileName => {
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card';
                fileCard.innerHTML = `
                    <div class="file-icon"> 📄 </div>
                    <div class="file-name" title="${fileName}">${fileName}</div>
                `;
                
                // THÊM 3 DÒNG NÀY ĐỂ KHI BẤM VÀO SẼ MỞ FILE RA XEM
                fileCard.addEventListener('click', () => {
                    window.open(`http://localhost:3000/uploads/${fileName}`, '_blank');
                });

                fileGrid.appendChild(fileCard);
            });
        })
        .catch(err => console.error('Lỗi tải danh sách file:', err));
}

// Gọi hàm này ngay khi trang web vừa tải xong để nó hiện file ra luôn
loadFiles();

// --- LOGIC CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ ---
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');
const switchAuthBtn = document.getElementById('switch-auth-btn');
const switchTextPrompt = document.getElementById('switch-text-prompt');

let isLoginMode = true; // Biến ghi nhớ trạng thái đang ở màn hình nào

switchAuthBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode; // Lật ngược trạng thái
    
    if (isLoginMode) {
        // Chuyển về màn hình Đăng nhập
        authTitle.innerText = 'Đăng nhập StudentHub';
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        switchTextPrompt.innerText = 'Chưa có tài khoản? ';
        switchAuthBtn.innerText = 'Đăng ký ngay';
    } else {
        // Chuyển sang màn hình Đăng ký
        authTitle.innerText = 'Đăng ký Tài khoản mới';
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        switchTextPrompt.innerText = 'Đã có tài khoản? ';
        switchAuthBtn.innerText = 'Đăng nhập ngay';
    }
});

// --- XỬ LÝ ĐĂNG NHẬP ---
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message.includes('thành công')) {
            alert('🎉 ' + data.message);
            
            // 1. Lưu thông tin người dùng vào bộ nhớ trình duyệt
            localStorage.setItem('currentUser', data.username);
            
            // 2. Ẩn màn hình đăng nhập đi
            document.getElementById('auth-modal').style.display = 'none';
            
            // 3. Cập nhật tên hiển thị ở Sidebar
            updateSidebarUserInfo();
        } else {
            alert('❌ ' + data.message); // Sai mật khẩu
        }
    })
    .catch(err => console.error('Lỗi đăng nhập:', err));
});

// --- HÀM CẬP NHẬT THÔNG TIN NGƯỜI DÙNG Ở SIDEBAR ---
function updateSidebarUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    const authModal = document.getElementById('auth-modal');
    
    if (currentUser) {
        // Đã đăng nhập: Ẩn form, cập nhật tên và avatar
        authModal.style.display = 'none';
        document.querySelector('.user-name').innerText = currentUser;
        
        // Cập nhật avatar theo tên
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=random`;
        document.querySelector('.user-avatar').src = avatarUrl;
    } else {
        // Chưa đăng nhập: Hiện form bắt buộc
        authModal.style.display = 'flex';
    }
}

// Chạy hàm này ngay khi load web để kiểm tra trạng thái
updateSidebarUserInfo();

// --- XỬ LÝ ĐĂNG KÝ TÀI KHOẢN ---
registerForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Ngăn trang web bị F5 lại khi bấm submit form
    
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // 1. Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
        alert('❌ Mật khẩu xác nhận không khớp!');
        return;
    }

    // 2. Gửi dữ liệu lên API Đăng ký
    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message.includes('thành công')) {
            alert('🎉 ' + data.message);
            // Bấm hộ nút chuyển về màn hình đăng nhập
            switchAuthBtn.click();
            // Xóa trắng form
            registerForm.reset();
        } else {
            alert('❌ ' + data.message); // Báo lỗi nếu trùng tên
        }
    })
    .catch(err => console.error('Lỗi đăng ký:', err));
});