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