// Authentication functions (simplified for demo)
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in (simplified)
    if (!localStorage.getItem('isLoggedIn') && window.location.pathname.includes('user/')) {
        window.location.href = '../auth/login.html';
    }

    // Login form handler (example)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = '../user/menu.html';
        });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            window.location.href = '../auth/login.html';
        });
    }
});
