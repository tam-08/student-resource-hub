// --- CHUYỂN TAB SIDEBAR ---
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
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    });
});

// --- TẢI FILE LÊN ---
const btnUpload = document.getElementById('btn-upload');
const fileInput = document.getElementById('file-input');

btnUpload.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function () {
    const selectedFile = this.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('myFile', selectedFile);
    formData.append('owner', localStorage.getItem('currentUser'));

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            alert('🎉 ' + data.message);
            fileInput.value = '';
            loadFiles();
        })
        .catch(err => {
            console.error('Lỗi tải file:', err);
            alert('❌ Có lỗi xảy ra khi tải file!');
        });
});

// --- HIỂN THỊ & TƯƠNG TÁC FILE ---
const fileGrid = document.getElementById('file-grid');
const sharedGrid = document.getElementById('shared-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const trashGrid = document.getElementById('trash-grid');

function createFileCard(file, mode = 'normal') {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';

    const isImage = file.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const previewContent = isImage
        ? `<img src="/uploads/${file.fileName}" class="preview-img" alt="${file.displayName}">`
        : `<div class="file-icon">📄</div>`;

    let actionsHTML = '';
    if (mode === 'trash') {
        actionsHTML = `
            <button class="btn-restore" title="Khôi phục">♻️</button>
            <button class="btn-delete-perm" title="Xóa vĩnh viễn">❌</button>
        `;
    } else if (mode === 'shared') {
        actionsHTML = `
            <span style="font-size: 12px; color: #666;">Từ: <b>${file.owner}</b></span>
            <button class="btn-download" title="Tải xuống">⬇️</button>
        `;
    } else {
        actionsHTML = `
            <button class="btn-fav" title="Yêu thích">${file.isFavorite ? '❤️' : '🤍'}</button>
            <button class="btn-download" title="Tải xuống">⬇️</button>
            <button class="btn-share" title="Chia sẻ">📤</button>
            <button class="btn-edit" title="Đổi tên">✏️</button>
            <button class="btn-delete" title="Xóa vào thùng rác">🗑️</button>
        `;
    }

    fileCard.innerHTML = `
        <div class="file-preview" style="cursor: pointer;">
            ${previewContent}
        </div>
        <div class="file-name" title="${file.displayName}">${file.displayName}</div>
        <div class="file-actions">${actionsHTML}</div>
    `;

    // Mở khung xem trước ngay trong trang khi bấm vào file
    fileCard.querySelector('.file-preview').addEventListener('click', () => openPreview(file));

    if (mode === 'trash') {
        fileCard.querySelector('.btn-restore').addEventListener('click', () => toggleTrash(file.id));
        fileCard.querySelector('.btn-delete-perm').addEventListener('click', () => deletePermanent(file.id));
    } else if (mode === 'shared') {
        fileCard.querySelector('.btn-download').addEventListener('click', () => {
            window.location.href = `/api/files/${file.id}/download`;
        });
    } else if (mode === 'normal') {
        fileCard.querySelector('.btn-fav').addEventListener('click', () => toggleFavorite(file.id));
        fileCard.querySelector('.btn-download').addEventListener('click', () => {
            window.location.href = `/api/files/${file.id}/download`;
        });
        fileCard.querySelector('.btn-share').addEventListener('click', () => shareFile(file.id));
        fileCard.querySelector('.btn-edit').addEventListener('click', () => renameFile(file.id, file.displayName));
        fileCard.querySelector('.btn-delete').addEventListener('click', () => toggleTrash(file.id));
    }

    return fileCard;
}

function loadFiles() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    fetch('/api/files')
        .then(res => res.json())
        .then(files => {
            const myFiles = files.filter(f => f.owner === currentUser && !f.isTrash);
            const favFiles = myFiles.filter(f => f.isFavorite);
            const trashFiles = files.filter(f => f.owner === currentUser && f.isTrash);
            const sharedFiles = files.filter(f => f.sharedWith && f.sharedWith.includes(currentUser) && !f.isTrash);

            fileGrid.innerHTML = myFiles.length ? '' : '<p>Chưa có tài liệu nào. Hãy tải lên!</p>';
            myFiles.forEach(file => fileGrid.appendChild(createFileCard(file, 'normal')));

            favoritesGrid.innerHTML = favFiles.length ? '' : '<p>Chưa có tài liệu yêu thích nào.</p>';
            favFiles.forEach(file => favoritesGrid.appendChild(createFileCard(file, 'normal')));

            trashGrid.innerHTML = trashFiles.length ? '' : '<p>Thùng rác trống.</p>';
            trashFiles.forEach(file => trashGrid.appendChild(createFileCard(file, 'trash')));

            sharedGrid.innerHTML = sharedFiles.length ? '' : '<p>Chưa có tài liệu nào được chia sẻ với bạn.</p>';
            sharedFiles.forEach(file => sharedGrid.appendChild(createFileCard(file, 'shared')));
        })
        .catch(err => console.error('Lỗi tải danh sách file:', err));
}

function toggleFavorite(id) {
    fetch(`/api/files/${id}/favorite`, { method: 'PUT' }).then(() => loadFiles());
}

function renameFile(id, oldName) {
    const newName = prompt('Nhập tên mới cho tài liệu:', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    fetch(`/api/files/${id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
    }).then(() => loadFiles());
}

function toggleTrash(id) {
    fetch(`/api/files/${id}/trash`, { method: 'PUT' }).then(() => loadFiles());
}

function deletePermanent(id) {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn tài liệu này không?')) return;
    fetch(`/api/files/${id}`, { method: 'DELETE' }).then(() => loadFiles());
}

function shareFile(id) {
    const targetUser = prompt('Nhập tên tài khoản bạn muốn chia sẻ cùng:');
    if (!targetUser || targetUser.trim() === '') return;

    fetch(`/api/files/${id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUser: targetUser.trim() })
    })
        .then(res => res.json())
        .then(data => alert(data.message));
}

// --- ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT / ĐỔI MẬT KHẨU ---
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');
const switchAuthBtn = document.getElementById('switch-auth-btn');
const switchTextPrompt = document.getElementById('switch-text-prompt');

let isLoginMode = true;

switchAuthBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = 'Đăng nhập StudentHub';
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        switchTextPrompt.innerText = 'Chưa có tài khoản? ';
        switchAuthBtn.innerText = 'Đăng ký ngay';
    } else {
        authTitle.innerText = 'Đăng ký Tài khoản mới';
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        switchTextPrompt.innerText = 'Đã có tài khoản? ';
        switchAuthBtn.innerText = 'Đăng nhập ngay';
    }
});

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message.includes('thành công')) {
                alert('🎉 ' + data.message);
                localStorage.setItem('currentUser', data.username);
                loginForm.reset();
                updateSidebarUserInfo();
                loadFiles();
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(err => console.error('Lỗi đăng nhập:', err));
});

registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert('❌ Mật khẩu xác nhận không khớp!');
        return;
    }

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message.includes('thành công')) {
                alert('🎉 ' + data.message);
                switchAuthBtn.click();
                registerForm.reset();
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(err => console.error('Lỗi đăng ký:', err));
});

document.getElementById('btn-logout').addEventListener('click', () => {
    if (!confirm('Bạn muốn đăng xuất khỏi StudentHub?')) return;
    localStorage.removeItem('currentUser');
    fileGrid.innerHTML = '';
    sharedGrid.innerHTML = '';
    favoritesGrid.innerHTML = '';
    trashGrid.innerHTML = '';
    updateSidebarUserInfo();
});

document.getElementById('btn-change-pass').addEventListener('click', () => {
    const currentUser = localStorage.getItem('currentUser');
    const oldPassword = prompt('Nhập mật khẩu hiện tại:');
    if (!oldPassword) return;
    const newPassword = prompt('Nhập mật khẩu mới:');
    if (!newPassword) return;

    fetch('/api/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, oldPassword, newPassword })
    })
        .then(res => res.json())
        .then(data => alert(data.message));
});

function updateSidebarUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    const authModal = document.getElementById('auth-modal');

    if (currentUser) {
        authModal.style.display = 'none';
        document.querySelector('.user-name').innerText = currentUser;
        document.querySelector('.user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=random`;
    } else {
        authModal.style.display = 'flex';
    }
}
// --- XỬ LÝ XEM TRƯỚC FILE TRONG TRANG ---
const previewModal = document.getElementById('preview-modal');
const previewTitle = document.getElementById('preview-title');
const previewBody = document.getElementById('preview-body');
const closePreviewBtn = document.getElementById('close-preview');

function openPreview(file) {
    previewTitle.innerText = file.displayName;
    const fileUrl = `/uploads/${file.fileName}`;

    if (file.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        previewBody.innerHTML = `<img src="${fileUrl}" alt="${file.displayName}">`;
    } else if (file.fileName.match(/\.(pdf|txt)$/i)) {
        previewBody.innerHTML = `<iframe src="${fileUrl}"></iframe>`;
    } else if (file.fileName.match(/\.docx$/i)) {
        previewBody.innerHTML = `<p style="color: #fff;">⏳ Đang tải nội dung tài liệu...</p>`;
        fetch(fileUrl)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
            .then(result => {
                previewBody.innerHTML = `
                    <div style="background: #fff; color: #1e293b; width: 100%; height: 100%; overflow-y: auto; padding: 24px 32px; text-align: left; line-height: 1.6; border-radius: 6px;">
                        ${result.value}
                    </div>
                `;
            })
            .catch(() => {
                previewBody.innerHTML = `<p style="color: #fff;">❌ Không thể đọc nội dung file Word này.</p>`;
            });
    } else {
        previewBody.innerHTML = `
            <div style="color: #fff; text-align: center;">
                <p style="margin-bottom: 14px;">Định dạng này chưa hỗ trợ xem trực tiếp.</p>
                <a href="/api/files/${file.id}/download" class="btn-primary" style="text-decoration: none; display: inline-block;">⬇️ Tải xuống để xem</a>
            </div>
        `;
    }

    previewModal.style.display = 'flex';
}

function closePreview() {
    previewModal.style.display = 'none';
    previewBody.innerHTML = '';
}

closePreviewBtn.addEventListener('click', closePreview);

// Bấm ra vùng tối bên ngoài cũng tự đóng
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreview();
});

// Nhấn phím Esc trên bàn phím cũng tự đóng
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal.style.display === 'flex') {
        closePreview();
    }
});
updateSidebarUserInfo();
loadFiles();