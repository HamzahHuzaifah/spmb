// Toggle Visibility Input Sandi
document.addEventListener('DOMContentLoaded', function() {
    const eyeIcon = document.querySelector('#togglePassword');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    const pwdInput = document.querySelector('#password');

    const handleToggle = function() {
        if (!pwdInput || !eyeIcon) return;
        const isMasked = pwdInput.getAttribute('type') === 'password';
        pwdInput.setAttribute('type', isMasked ? 'text' : 'password');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    };

    if (toggleBtn) {
        toggleBtn.addEventListener('click', handleToggle);
    } else if (eyeIcon) {
        eyeIcon.addEventListener('click', handleToggle);
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
