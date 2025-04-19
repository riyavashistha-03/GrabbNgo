// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between user and staff fields in signup
    const userTypeSelect = document.getElementById('signupUserType');
    const userFields = document.getElementById('userFields');
    const staffFields = document.getElementById('staffFields');
    
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', function() {
            if (this.value === 'staff') {
                userFields.style.display = 'none';
                staffFields.style.display = 'block';
                // Remove required from user fields
                document.getElementById('name').required = false;
                document.getElementById('email').required = false;
                document.getElementById('userMobile').required = false;
                document.getElementById('userPassword').required = false;
                document.getElementById('confirmPassword').required = false;
                // Add required to staff fields
                document.getElementById('staffName').required = true;
                document.getElementById('staffMobile').required = true;
                document.getElementById('staffPassword').required = true;
                document.getElementById('staffConfirmPassword').required = true;
                document.getElementById('staffCode').required = true;
            } else {
                userFields.style.display = 'block';
                staffFields.style.display = 'none';
                // Add required to user fields
                document.getElementById('name').required = true;
                document.getElementById('email').required = true;
                document.getElementById('userMobile').required = true;
                document.getElementById('userPassword').required = true;
                document.getElementById('confirmPassword').required = true;
                // Remove required from staff fields
                document.getElementById('staffName').required = false;
                document.getElementById('staffMobile').required = false;
                document.getElementById('staffPassword').required = false;
                document.getElementById('staffConfirmPassword').required = false;
                document.getElementById('staffCode').required = false;
            }
        });
    }
    
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userType = document.getElementById('userType').value;
            const mobile = document.getElementById('mobile').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            if (!mobile || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userType, mobile, password })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    alert('Login failed: ' + (errorData.message || 'Unknown error'));
                    return;
                }
                
                const data = await response.json();
                // Store token or session info as needed
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userType', userType);
                localStorage.setItem('isLoggedIn', 'true');
                
                if (remember) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    localStorage.removeItem('rememberMe');
                }
                
                if (userType === 'staff') {
                    window.location.href = 'staff/dashboard.html';
                } else {
                    window.location.href = 'user/menu.html';
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        });
    }
    
    // Handle signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userType = document.getElementById('signupUserType').value;
            
            if (userType === 'user') {
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const mobile = document.getElementById('userMobile').value;
                const password = document.getElementById('userPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (!name || !email || !mobile || !password || !confirmPassword) {
                    alert('Please fill in all fields');
                    return;
                }
                
                if (password !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }
                
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/signup/user`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, email, mobile, password })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        alert('Signup failed: ' + (errorData.message || 'Unknown error'));
                        return;
                    }
                    
                    alert('Account created successfully! Please login.');
                    window.location.href = 'login.html';
                } catch (error) {
                    alert('Signup error: ' + error.message);
                }
            } else {
                const name = document.getElementById('staffName').value;
                const mobile = document.getElementById('staffMobile').value;
                const password = document.getElementById('staffPassword').value;
                const confirmPassword = document.getElementById('staffConfirmPassword').value;
                const staffCode = document.getElementById('staffCode').value;
                
                if (!name || !mobile || !password || !confirmPassword || !staffCode) {
                    alert('Please fill in all fields');
                    return;
                }
                
                if (password !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }
                
                if (staffCode !== 'STAFF123') { // Example code, backend should verify this
                    alert('Invalid staff verification code');
                    return;
                }
                
                try {
                    console.log('Sending staff signup request with:', { name, mobile, password, staffCode });
                    const response = await fetch(`${API_BASE_URL}/auth/signup/staff`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, mobile, password, staffCode })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Signup failed:', errorData);
                        alert('Signup failed: ' + (errorData.message || 'Unknown error'));
                        return;
                    }
                    
                    alert('Staff account created successfully! Please login.');
                    // Fix: Add return here to prevent further execution
                    window.location.href = 'login.html';
                    return;
                } catch (error) {
                    console.error('Signup error:', error);
                    alert('Signup error: ' + error.message);
                }
            }
        });
    }
    
    // Handle forgot password form submission
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userType = document.getElementById('recoveryUserType').value;
            const mobile = document.getElementById('recoveryMobile').value;
            
            if (userType === 'user') {
                const email = document.getElementById('recoveryEmail').value;
                
                if (!mobile || !email) {
                    alert('Please fill in all fields');
                    return;
                }
                
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/password-recovery/user`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mobile, email })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        alert('Password recovery failed: ' + (errorData.message || 'Unknown error'));
                        return;
                    }
                    
                    alert('Password reset instructions have been sent to your registered email/mobile.');
                } catch (error) {
                    alert('Password recovery error: ' + error.message);
                }
            } else {
                if (!mobile) {
                    alert('Please enter your mobile number');
                    return;
                }
                
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/password-recovery/staff`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mobile })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        alert('Password recovery failed: ' + (errorData.message || 'Unknown error'));
                        return;
                    }
                    
                    alert('Password reset instructions have been sent to your registered mobile.');
                } catch (error) {
                    alert('Password recovery error: ' + error.message);
                }
            }
        });
    }
    
    // Image upload preview for dish form
    const dishImageInput = document.getElementById('dishImage');
    const imageFileName = document.getElementById('imageFileName');
    
    if (dishImageInput && imageFileName) {
        dishImageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                imageFileName.textContent = this.files[0].name;
            }
        });
    }
    
    // Handle add dish form submission
    const addDishForm = document.getElementById('addDishForm');
    if (addDishForm) {
        addDishForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const dishName = document.getElementById('dishName').value;
            const dishCategory = document.getElementById('dishCategory').value;
            const dishPrice = document.getElementById('dishPrice').value;
            const dishAvailability = document.getElementById('dishAvailability').value;
            const dishDescription = document.getElementById('dishDescription').value;
            const dishImage = document.getElementById('dishImage').files[0];
            
            if (!dishName || !dishCategory || !dishPrice || !dishAvailability) {
                alert('Please fill in all required fields');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('name', dishName);
                formData.append('category', dishCategory);
                formData.append('price', dishPrice);
                formData.append('availability', dishAvailability);
                formData.append('description', dishDescription);
                if (dishImage) {
                    formData.append('image', dishImage);
                }
                
                const response = await fetch(`${API_BASE_URL}/dishes`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    alert('Failed to add dish: ' + (errorData.message || 'Unknown error'));
                    return;
                }
                
                alert('Dish added successfully!');
                this.reset();
                imageFileName.textContent = 'No image selected';
            } catch (error) {
                alert('Error adding dish: ' + error.message);
            }
        });
    }
    
    // Check for remembered login
    if (localStorage.getItem('rememberMe') === 'true' && window.location.pathname.includes('login.html')) {
        // In a real app, you would auto-fill the login form or auto-login
        console.log('Remember me is enabled');
    }
});
