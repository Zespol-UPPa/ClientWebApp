const API_BASE_URL = null;
const USE_API = false;

document.addEventListener('DOMContentLoaded', function() {

    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        const handleLogoNavigation = function() {
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
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

    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const consentCheckbox = document.getElementById('consentCheckbox');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const signUpBtn = document.getElementById('signUpBtn');
    const errorMessage = document.getElementById('errorMessage');
    const termsLink = document.getElementById('termsLink');
    const privacyLink = document.getElementById('privacyLink');

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const consent = consentCheckbox.checked;
        const terms = termsCheckbox.checked;

        hideError();

        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            showError('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (!consent) {
            showError('Please consent to the processing of your personal data');
            return;
        }

        if (!terms) {
            showError('Please accept the Terms of Service and Privacy Policy');
            return;
        }

        signUpBtn.disabled = true;
        signUpBtn.textContent = 'Signing up...';

        try {
            const success = await attemptRegister({
                email,
                password,
                firstName,
                lastName
            });
            
            if (success) {
                console.log('Registration successful');
                window.location.href = 'login.html';
            } else {
                showError('Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred. Please try again later.');
        } finally {
            signUpBtn.disabled = false;
            signUpBtn.textContent = 'Sign up';
        }
    });

    termsLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Terms of Service clicked');
    });

    privacyLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Privacy Policy clicked');
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

    async function attemptRegister(userData) {
        if (USE_API && API_BASE_URL) {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: userData.email,
                        password: userData.password,
                        firstName: userData.firstName,
                        lastName: userData.lastName
                    })
                });

                if (!response.ok) {
                    if (response.status === 409) {
                        showError('Email already exists. Please use a different email.');
                        return false;
                    }
                    if (response.status === 400) {
                        const errorData = await response.json();
                        showError(errorData.message || 'Invalid registration data');
                        return false;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // TODO: Store authentication token 
                
                return true;
            } catch (error) {
                console.error('API registration error:', error);
                throw error;
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Mock registration successful');
            return true;
        }
    }
    emailInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
    confirmPasswordInput.addEventListener('input', hideError);
    firstNameInput.addEventListener('input', hideError);
    lastNameInput.addEventListener('input', hideError);
    consentCheckbox.addEventListener('change', hideError);
    termsCheckbox.addEventListener('change', hideError);
});

