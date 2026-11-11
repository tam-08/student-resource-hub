const menuItems = document.querySelectorAll('.nav-menu li');
const contentSelection = document.querySelectorAll('.content-section');
menuItems.forEach(item => {
    item.addEventListener('click', function() {
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
fileInput.addEventListener('change', function() {
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
    })
    .catch(error => {
        console.error('Lỗi tải file:', error);
        alert ('❌ Có lỗi xảy ra khi tải file!');
    });
});