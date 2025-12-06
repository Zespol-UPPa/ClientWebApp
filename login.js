
const API_BASE_URL = null;
const USE_API = false;

document.addEventListener('DOMContentLoaded', function() {
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
                window.location.href = 'home.html';
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
        if (USE_API && API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        return false;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                return true;
            } catch (error) {
                console.error('API login error:', error);
                throw error;
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (email === 'demo@parkflow.com' && password === 'demo123') {
                console.log('Mock login successful');
                return true;
            }
            
            return false;
        }
    }

    emailInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
});

