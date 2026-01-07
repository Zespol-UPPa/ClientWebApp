// Verification page script
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const statusText = document.getElementById('statusText');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const actionLinks = document.getElementById('actionLinks');
    const actionButtons = document.getElementById('actionButtons');
    const countdown = document.getElementById('countdown');
    
    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
        logoLink.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = 'home.html';
            }
        });
    }
    
    if (!token) {
        showError('Brak tokenu weryfikacyjnego. Sprawdź czy skopiowałeś pełny link z emaila.', [
            { text: 'Wróć do strony głównej', href: 'home.html', primary: false }
        ]);
        return;
    }
    
    verifyAccount(token);
    
    async function verifyAccount(token) {
        try {
            const response = await api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`, false);
            
            loadingSpinner.style.display = 'none';
            statusText.textContent = 'Konto zweryfikowane pomyślnie!';
            successMessage.textContent = 'Dziękujemy za weryfikację! Twoje konto jest już aktywne. Możesz się teraz zalogować.';
            successMessage.style.display = 'block';
            
            showActionButtons([
                { text: 'Przejdź do logowania', href: 'login.html', primary: true }
            ]);
            
            // Auto-redirect after 5 seconds
            startCountdown(5, () => {
                window.location.href = 'login.html';
            });
            
        } catch (error) {
            loadingSpinner.style.display = 'none';
            statusText.textContent = 'Weryfikacja nie powiodła się';
            
            let errorMsg = '';
            let buttons = [];
            
            if (error.message.includes('expired')) {
                errorMsg = 'Link weryfikacyjny wygasł. Możesz poprosić o nowy email weryfikacyjny.';
                buttons = [
                    { text: 'Wyślij ponownie email', href: '#', primary: true, action: () => resendVerification(token) },
                    { text: 'Wróć do strony głównej', href: 'home.html', primary: false }
                ];
            } else if (error.message.includes('already used')) {
                errorMsg = 'Ten link został już użyty. Twoje konto jest już aktywne.';
                buttons = [
                    { text: 'Przejdź do logowania', href: 'login.html', primary: true }
                ];
            } else if (error.message.includes('already activated')) {
                errorMsg = 'Twoje konto jest już aktywne. Możesz się zalogować.';
                successMessage.textContent = errorMsg;
                successMessage.style.display = 'block';
                showActionButtons([
                    { text: 'Przejdź do logowania', href: 'login.html', primary: true }
                ]);
                return;
            } else if (error.message.includes('Invalid') || error.message.includes('token')) {
                errorMsg = 'Nieprawidłowy link weryfikacyjny. Sprawdź czy skopiowałeś pełny link z emaila.';
                buttons = [
                    { text: 'Wróć do strony głównej', href: 'home.html', primary: false }
                ];
            } else {
                errorMsg = 'Wystąpił błąd podczas weryfikacji. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.';
                buttons = [
                    { text: 'Spróbuj ponownie', href: window.location.href, primary: true },
                    { text: 'Wróć do strony głównej', href: 'home.html', primary: false }
                ];
            }
            
            errorMessage.textContent = errorMsg;
            errorMessage.style.display = 'block';
            showActionButtons(buttons);
        }
    }
    
    function showError(message, buttons = []) {
        loadingSpinner.style.display = 'none';
        statusText.textContent = 'Błąd';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        showActionButtons(buttons);
    }
    
    function showActionButtons(buttons) {
        actionButtons.innerHTML = '';
        buttons.forEach(button => {
            const a = document.createElement('a');
            a.href = button.href;
            a.className = `action-button ${button.primary ? 'action-button-primary' : 'action-button-secondary'}`;
            a.textContent = button.text;
            if (button.action) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    button.action();
                });
            }
            actionButtons.appendChild(a);
        });
        actionLinks.style.display = 'block';
    }
    
    function startCountdown(seconds, callback) {
        let remaining = seconds;
        countdown.style.display = 'block';
        countdown.textContent = `Automatyczne przekierowanie za ${remaining} sekund...`;
        
        const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                countdown.textContent = `Automatyczne przekierowanie za ${remaining} sekund...`;
            } else {
                clearInterval(interval);
                countdown.textContent = 'Przekierowywanie...';
                callback();
            }
        }, 1000);
    }
    
    async function resendVerification(token) {
        // Extract email from token or prompt user
        // For now, redirect to registration page
        // In future, we could store email in localStorage during registration
        const email = prompt('Podaj adres email, na który chcesz otrzymać nowy link weryfikacyjny:');
        if (!email) {
            return;
        }
        
        try {
            const response = await api.post('/api/auth/resend-verification', { email: email }, false);
            alert('Email weryfikacyjny został wysłany. Sprawdź swoją skrzynkę pocztową.');
            // Optionally redirect to login or stay on page
        } catch (error) {
            alert('Nie udało się wysłać emaila. Spróbuj ponownie później lub zarejestruj się ponownie.');
        }
    }
});

