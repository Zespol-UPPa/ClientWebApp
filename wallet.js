// API module is loaded from api.js

let walletData = {
    balance: 0,
    totalSpent: 0,
    totalTopUps: 0,
    totalTransactions: 0
};

let transactions = [];
let filteredTransactions = [];
let currentFilter = 'all';


let selectedAmount = 10;
let selectedPaymentMethod = 'blik';
let isCustomAmount = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check authorization before executing any requests
    if (!api.isTokenValid()) {
        api.redirectToLogin();
        return; // Don't load the page
    }

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

    // Setup modal and filters first (don't require API calls)
    setupTopUpModal();
    setupFilters();
    
    // Load data first, then setup header and navigation
    // This ensures header/navigation reflect the actual authentication state
    loadWalletData().then(() => {
        // After data is loaded, setup header and navigation
        // This ensures they reflect the correct state
        setupHeader();
        setupBottomNavigation();
    }).catch((error) => {
        // If loadWalletData fails, still setup header/navigation
        // They will show logged out state if token is invalid
        setupHeader();
        setupBottomNavigation();
    });
});



function setupHeader() {
    const isLoggedIn = isUserLoggedIn();
    const loggedInNavHeader = document.getElementById('loggedInNavHeader');
    const loggedOutNavHeader = document.getElementById('loggedOutNavHeader');
    const getStartedBtn = document.querySelector('.get-started-btn');

    if (isLoggedIn) {
        loggedInNavHeader.style.display = 'block';
        loggedOutNavHeader.style.display = 'none';
        setupLoggedInHeader();
    } else {
        loggedInNavHeader.style.display = 'none';
        loggedOutNavHeader.style.display = 'flex';
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', function() {
                window.location.href = 'register.html';
            });
        }
    }
}

function setupLoggedInHeader() {
    const userIconBtn = document.getElementById('loggedInNavHeader');
    if (userIconBtn) {
        userIconBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
}

function setupBottomNavigation() {
    const isLoggedIn = isUserLoggedIn();
    const loggedInNav = document.getElementById('loggedInNav');
    const loggedOutNav = document.getElementById('loggedOutNav');

    if (isLoggedIn) {
        loggedInNav.style.display = 'flex';
        loggedOutNav.style.display = 'none';
        setupLoggedInNavigation();
    } else {
        loggedInNav.style.display = 'none';
        loggedOutNav.style.display = 'flex';
        setupLoggedOutNavigation();
    }
}

function setupLoggedInNavigation() {
    const navItems = document.querySelectorAll('.logged-in-nav .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            handleNavigation(page, this);
        });
    });
}

function handleNavigation(page, clickedItem) {
    document.querySelectorAll('.logged-in-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    clickedItem.classList.add('active');
    
    switch(page) {
        case 'dashboard':
            window.location.href = 'dashboard.html';
            break;
        case 'parking':
            window.location.href = 'search.html';
            break;
        case 'wallet':
            break;
        case 'history':
            window.location.href = 'history.html';
            break;
        case 'profile':
            window.location.href = 'profile.html';
            break;
    }
}

function setupLoggedOutNavigation() {
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
    }
}

function isUserLoggedIn() {
    return api.isTokenValid();
}


function setupTopUpModal() {
    const topUpBtn = document.getElementById('topUpBtn');
    const closeModalBtn = document.getElementById('closeTopUpModal');
    const topUpModal = document.getElementById('topUpModal');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountBtn = document.getElementById('customAmountBtn');
    const customAmountInput = document.getElementById('customAmountInput');
    const paymentMethodButtons = document.querySelectorAll('.payment-method-btn');
    const topUpSubmitBtn = document.getElementById('topUpSubmitBtn');

    topUpBtn.addEventListener('click', function() {
        openTopUpModal();
    });

    closeModalBtn.addEventListener('click', function() {
        closeTopUpModal();
    });

    topUpModal.addEventListener('click', function(e) {
        if (e.target === topUpModal) {
            closeTopUpModal();
        }
    });

    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            amountButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedAmount = parseFloat(this.getAttribute('data-amount'));
            isCustomAmount = false;
            customAmountInput.style.display = 'none';
            customAmountInput.value = '';
            updateTopUpButton();
        });
    });

    customAmountBtn.addEventListener('click', function() {
        amountButtons.forEach(b => b.classList.remove('selected'));
        isCustomAmount = true;
        customAmountInput.style.display = 'block';
        customAmountInput.focus();
    });

    customAmountInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (value && value > 0) {
            selectedAmount = value;
            updateTopUpButton();
        }
    });

    paymentMethodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentMethodButtons.forEach(b => {
                b.classList.remove('active');
                b.querySelector('.check-icon').style.display = 'none';
            });
            this.classList.add('active');
            this.querySelector('.check-icon').style.display = 'block';
            selectedPaymentMethod = this.getAttribute('data-method');
        });
    });

    topUpSubmitBtn.addEventListener('click', async function() {
        await handleTopUp();
    });
}

function openTopUpModal() {
    const modal = document.getElementById('topUpModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    selectedAmount = 10;
    selectedPaymentMethod = 'blik';
    isCustomAmount = false;
    document.querySelectorAll('.amount-btn')[0].classList.add('selected');
    document.getElementById('customAmountInput').style.display = 'none';
    document.getElementById('customAmountInput').value = '';
    updateTopUpButton();
}

function closeTopUpModal() {
    const modal = document.getElementById('topUpModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('topUpErrorMessage').style.display = 'none';
}

function updateTopUpButton() {
    const submitBtn = document.getElementById('topUpSubmitBtn');
    submitBtn.textContent = `Top Up $${selectedAmount.toFixed(2)}`;
}

function setupFilters() {
    const filterPills = document.querySelectorAll('.filter-pill');
    
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            applyFilters();
        });
    });
}

function applyFilters() {
    filteredTransactions = [...transactions];

    switch(currentFilter) {
        case 'topups':
            filteredTransactions = filteredTransactions.filter(t => t.type === 'topup');
            break;
        case 'payments':
            filteredTransactions = filteredTransactions.filter(t => t.type === 'payment');
            break;
        case 'thisMonth':
            const now = new Date();
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear();
            });
            break;
    }

    renderTransactions();
}

async function loadWalletData() {
    // Use Promise.allSettled() instead of Promise.all() to handle partial failures gracefully
    const results = await Promise.allSettled([
        loadWalletBalance(),
        loadTransactions()
    ]);
    
    // Check for 401 errors and redirect if needed
    let hasUnauthorizedError = false;
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const error = result.reason;
            if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                hasUnauthorizedError = true;
            } else {
                console.error(`Error loading wallet data ${index}:`, error);
            }
        }
    });
    
    if (hasUnauthorizedError) {
        api.redirectToLogin();
        return;
    }
    
    renderWalletData();
    renderTransactions();
}

async function loadWalletBalance() {
    try {
        const data = await api.get('/customer/wallet');
        // Backend returns balance_minor (in cents), convert to dollars
        const balance = data.balance_minor ? parseFloat(data.balance_minor) / 100 : 0;
        walletData = {
            balance: balance,
            totalSpent: data.totalSpent || 0,
            totalTopUps: data.totalTopUps || 0,
            totalTransactions: data.totalTransactions || transactions.length
        };
    } catch (error) {
        // Check if it's an authorization error (401) - only 401 should cause redirect
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        // For 404 or other errors, set default values without throwing
        // This allows the page to load with empty wallet data
        if (error && error.message.includes('404')) {
            console.log('Wallet not found (404), using default values');
        } else {
            console.error('Error loading wallet balance:', error);
        }
        walletData = { balance: 0, totalSpent: 0, totalTopUps: 0, totalTransactions: 0 };
    }
}

async function loadTransactions() {
    try {
        // Note: This endpoint needs to be implemented in customer-service or payment-service
        // For now, return empty array
        transactions = [];
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading transactions:', error);
        transactions = [];
    }
}

async function processTopUp(amount, paymentMethod) {
    try {
        // Wywołaj endpoint backendu
        if (api && typeof api.post === 'function') {
            const payload = { 
                amountMinor: Math.round(amount * 100), 
                paymentMethod: paymentMethod || 'blik' 
            };
            const res = await api.post('/customer/wallet/topup', payload);
            // Backend zwraca: { paymentId, newBalance }
            return { success: true, paymentId: res.paymentId, newBalance: res.newBalance };
        } else {
            throw new Error('API post not available');
        }
    } catch (error) {
        console.error('Top up API failed:', error);
        throw error; // Rzuć błąd zamiast używać fallback - backend powinien działać
    }
}

function renderWalletData() {
    document.getElementById('totalBalance').textContent = `$${walletData.balance.toFixed(2)}`;
    document.getElementById('totalSpent').textContent = `$${walletData.totalSpent.toFixed(2)}`;
    document.getElementById('totalTopUps').textContent = `$${walletData.totalTopUps.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = walletData.totalTransactions;
}

function renderTransactions() {
    const container = document.getElementById('transactionsContainer');

    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No transactions</h3>
                <p>Your transactions will appear here</p>
            </div>
        `;
        return;
    }

    const groupedByDate = groupByDate(filteredTransactions);

    container.innerHTML = Object.keys(groupedByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(dateKey => {
            const dateTransactions = groupedByDate[dateKey];
            return `
                <div class="date-group">
                    <div class="date-label">${formatDateLabel(dateKey)}</div>
                    ${dateTransactions.map(transaction => renderTransactionItem(transaction)).join('')}
                </div>
            `;
        }).join('');
}

function renderTransactionItem(transaction) {
    const isPositive = transaction.amount > 0;
    const amountClass = isPositive ? 'positive' : 'negative';
    const amountSign = isPositive ? '+' : '';
    
    return `
        <div class="transaction-item">
            <div class="transaction-info">
                <h4 class="transaction-title">${transaction.title}</h4>
                <p class="transaction-details">${transaction.details}${transaction.time ? ' • ' + transaction.time : ''}</p>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}$${Math.abs(transaction.amount).toFixed(2)}
            </div>
        </div>
    `;
}

function groupByDate(transactions) {
    const grouped = {};
    transactions.forEach(transaction => {
        const dateKey = transaction.date;
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(transaction);
    });
    return grouped;
}

function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

async function handleTopUp() {
    const errorMessage = document.getElementById('topUpErrorMessage');
    const submitBtn = document.getElementById('topUpSubmitBtn');
    
    if (!selectedAmount || selectedAmount <= 0) {
        errorMessage.textContent = 'Please select or enter a valid amount';
        errorMessage.style.display = 'block';
        return;
    }

    errorMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        await processTopUp(selectedAmount, selectedPaymentMethod);
        closeTopUpModal();
        await loadWalletData();
    } catch (error) {
        errorMessage.textContent = error.message || 'Error processing top up. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        updateTopUpButton();
    }
}

