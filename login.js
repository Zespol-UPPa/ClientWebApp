// API module is loaded from api.js

document.addEventListener('DOMContentLoaded', function() {

    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        const handleLogoNavigation = function() {
            if (api.isTokenValid()) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'home.html';
            }
        };
        
        logoLink.addEventListener('click', handleLogoNavigation);
        logoLink.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoNavigation();
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const signInBtn = document.getElementById('signInBtn');
    const errorMessage = document.getElementById('errorMessage');
    const signUpLink = document.getElementById('signUpLink');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;


        hideError();

        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        signInBtn.disabled = true;
        signInBtn.textContent = 'Signing in...';

        try {
            const success = await attemptLogin(email, password);
            
            if (success) {
                console.log('Login successful');
                window.location.href = 'dashboard.html';
            } else {
                showError('Invalid email or password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again later.');
        } finally {
            signInBtn.disabled = false;
            signInBtn.textContent = 'Sign in';
        }
    });

    signUpLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Sign up clicked');
        window.location.href = 'register.html';
    });

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    async function attemptLogin(email, password) {
        try {
            const data = await api.post('/api/auth/login', {
                username: email,
                password: password
            }, false); // Login doesn't require auth
            
            if (data.token) {
                api.setToken(data.token);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('API login error:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                return false;
            }
            throw error;
        }
    }

    emailInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
});

