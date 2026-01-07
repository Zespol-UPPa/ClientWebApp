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
            const response = await attemptRegister({
                email,
                password,
                firstName,
                lastName
            });
            
            if (response) {
                // Show success message instead of redirecting
                registerForm.style.display = 'none';
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.style.cssText = 'background-color: #d4edda; color: #155724; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;';
                successMessage.innerHTML = `
                    <h3 style="margin-top: 0;">Registration Successful!</h3>
                    <p>We've sent a verification email to <strong>${email}</strong>.</p>
                    <p>Please check your email and click the verification link to activate your account.</p>
                    <p style="margin-top: 20px;">
                        <a href="login.html" style="color: #6B46C1; text-decoration: underline;">Go to Sign In</a>
                    </p>
                `;
                registerForm.parentNode.insertBefore(successMessage, registerForm.nextSibling);
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
        try {
            const response = await api.post('/api/auth/register', {
                username: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            }, false); // Registration doesn't require auth
            
            return response; // Return response object which contains message
        } catch (error) {
            console.error('API registration error:', error);
            if (error.message.includes('409') || error.message.includes('already exists')) {
                showError('Email already exists. Please use a different email.');
                return false;
            }
            if (error.message.includes('400') || error.message.includes('Invalid')) {
                showError('Invalid registration data. Please check your information.');
                return false;
            }
            throw error;
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

