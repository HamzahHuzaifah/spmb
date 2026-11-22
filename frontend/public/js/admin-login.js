// Toggle Password Visibility
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.querySelector('#togglePassword');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    const password = document.querySelector('#password');

    const handleToggle = function() {
        if (!password || !togglePassword) return;
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    };

    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleToggle);
    } else if (togglePassword) {
        togglePassword.addEventListener('click', handleToggle);
    }

    // Add loading state to button on submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            const btn = this.querySelector('.btn-submit');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Memproses...</span>';
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.8';
            }
        });
    }
});
