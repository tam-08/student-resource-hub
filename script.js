const menuItems = document.querySelectorAll('.nav-menu li');
const contentSelection = document.querySelectorAll('.content-section');
menuItems.forEach(item => {
    item.addEventListener('click', function() {
        menuItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        contentSelection.forEach(section => {
        section.style.dispaly = 'none';
        });
        const targetSection = document.getElementById(targetId);
        if (targetId) {
            targetSection.style.display = 'block';
        }
    });
});