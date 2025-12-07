const API_BASE_URL = null;
const USE_API = false;

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

    setupHeader();
    setupBottomNavigation();
    setupTopUpModal();
    setupFilters();
    loadWalletData();
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
            console.log('User icon clicked');
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
    const authToken = localStorage.getItem('authToken');
    return !!authToken;
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
    await Promise.all([
        loadWalletBalance(),
        loadTransactions()
    ]);
    renderWalletData();
    renderTransactions();
}

async function loadWalletBalance() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            walletData = {
                balance: data.balance || 0,
                totalSpent: data.totalSpent || 0,
                totalTopUps: data.totalTopUps || 0,
                totalTransactions: data.totalTransactions || 0
            };
        } catch (error) {
            console.error('Error loading wallet balance:', error);
            walletData = { balance: 0, totalSpent: 0, totalTopUps: 0, totalTransactions: 0 };
        }
    } else {
        walletData = {
            balance: 45.80,
            totalSpent: 125.50,
            totalTopUps: 200.00,
            totalTransactions: 23
        };
    }
}

async function loadTransactions() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet/transactions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            transactions = data.transactions || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            transactions = [];
        }
    } else {
        transactions = [
            {
                id: 1,
                type: 'payment',
                title: 'Parking Payment',
                details: 'Downtown Plaza • A-23',
                amount: -8.50,
                date: new Date().toISOString().split('T')[0],
                time: '14:30'
            },
            {
                id: 2,
                type: 'topup',
                title: 'Wallet Top Up',
                details: 'BLIK',
                amount: 50.00,
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                time: '10:15'
            },
            {
                id: 3,
                type: 'payment',
                title: 'Parking Payment',
                details: 'Downtown Plaza • A-23',
                amount: -8.50,
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                time: '14:30'
            },
            {
                id: 4,
                type: 'topup',
                title: 'Wallet Top Up',
                details: 'Credit Card ****4923',
                amount: 50.00,
                date: '2025-11-08',
                time: '10:15'
            }
        ];
    }
}

async function processTopUp(amount, paymentMethod) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/wallet/topup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    paymentMethod: paymentMethod
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error processing top up:', error);
            throw error;
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newTransaction = {
            id: transactions.length + 1,
            type: 'topup',
            title: 'Wallet Top Up',
            details: paymentMethod === 'blik' ? 'BLIK' : 'Bank Transfer',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        };
        
        transactions.unshift(newTransaction);
        walletData.balance += amount;
        walletData.totalTopUps += amount;
        walletData.totalTransactions += 1;
        
        return { success: true };
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

