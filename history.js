// API module is loaded from api.js


let statistics = {
    totalSessions: 0,
    totalTime: 0, 
    totalSpent: 0
};

let historyData = [];
let filteredHistory = [];
let currentFilter = 'all';
let startDate = null;
let endDate = null;

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

    // Setup filters first (doesn't require API calls)
    setupFilters();
    
    // Load data first, then setup header and navigation
    // This ensures header/navigation reflect the actual authentication state
    loadHistory().then(() => {
        // After data is loaded, setup header and navigation
        // This ensures they reflect the correct state
        setupHeader();
        setupBottomNavigation();
    }).catch((error) => {
        // If loadHistory fails, still setup header/navigation
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
            window.location.href = 'wallet.html';
            break;
        case 'history':
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


function setupFilters() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            applyFilters();
        });
    });

    startDateInput.addEventListener('change', function() {
        startDate = this.value ? new Date(this.value) : null;
        applyFilters();
    });

    endDateInput.addEventListener('change', function() {
        endDate = this.value ? new Date(this.value) : null;
        applyFilters();
    });
}

function applyFilters() {
    filteredHistory = [...historyData];

    if (startDate || endDate) {
        filteredHistory = filteredHistory.filter(session => {
            const sessionDate = new Date(session.date);
            if (startDate && sessionDate < startDate) return false;
            if (endDate && sessionDate > endDate) return false;
            return true;
        });
    }

    const now = new Date();
    switch(currentFilter) {
        case 'thisMonth':
            filteredHistory = filteredHistory.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate.getMonth() === now.getMonth() && 
                       sessionDate.getFullYear() === now.getFullYear();
            });
            break;
        case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            filteredHistory = filteredHistory.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate.getMonth() === lastMonth.getMonth() && 
                       sessionDate.getFullYear() === lastMonth.getFullYear();
            });
            break;
        case 'thisYear':
            filteredHistory = filteredHistory.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate.getFullYear() === now.getFullYear();
            });
            break;
    }

    renderHistory();
}


async function loadStatistics() {
    try {
        // Note: This endpoint needs to be implemented in customer-service
        const data = await api.get('/customer/history/statistics');
        statistics = {
            totalSessions: data.totalSessions || 0,
            totalTime: data.totalTime || 0,
            totalSpent: data.totalSpent || 0
        };
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            api.redirectToLogin();
            return;
        }
        console.error('Error loading statistics:', error);
        statistics = { totalSessions: 0, totalTime: 0, totalSpent: 0 };
    }
}

async function loadHistory() {
    try {
        // Note: This endpoint needs to be implemented in customer-service
        const data = await api.get('/customer/history');
        historyData = data.sessions || data || [];
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            api.redirectToLogin();
            return;
        }
        console.error('Error loading history:', error);
        historyData = [];
    }

    await loadStatistics();
    applyFilters();
    renderStatistics();
}

async function payForSession(sessionId) {
    try {
        // Note: This endpoint needs to be implemented in customer-service
        await api.post(`/customer/history/${sessionId}/pay`, null);
        return true;
    } catch (error) {
        console.error('Error paying for session:', error);
        throw error;
    }
}

function renderStatistics() {
    document.getElementById('totalSessions').textContent = statistics.totalSessions;
    document.getElementById('totalTime').textContent = `${statistics.totalTime}h`;
    document.getElementById('totalSpent').textContent = `$${statistics.totalSpent}`;
}

function renderHistory() {
    const container = document.getElementById('historyContainer');

    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No parking history</h3>
                <p>Your parking sessions will appear here</p>
            </div>
        `;
        return;
    }

    const groupedByMonth = groupByMonth(filteredHistory);

    container.innerHTML = Object.keys(groupedByMonth)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(monthKey => {
            const sessions = groupedByMonth[monthKey];
            return `
                <div class="month-group">
                    <h3 class="month-header">${formatMonthHeader(monthKey)}</h3>
                    ${sessions.map(session => renderHistoryItem(session)).join('')}
                </div>
            `;
        }).join('');

    container.querySelectorAll('.pay-now-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const sessionId = parseInt(this.getAttribute('data-session-id'));
            await handlePayNow(sessionId);
        });
    });
}

function renderHistoryItem(session) {
    const date = new Date(session.date);
    const formattedDate = formatDate(date);
    const isUnpaid = !session.isPaid;

    return `
        <div class="history-item ${isUnpaid ? 'unpaid' : ''}">
            ${isUnpaid ? `
                <div class="unpaid-banner">
                    <span class="unpaid-banner-text">UNPAID</span>
                </div>
                <div class="unpaid-message">
                    Please settle this payment to continue using parking services
                </div>
            ` : ''}
            <h4 class="history-location">${session.parkingName}</h4>
            <p class="history-address">${session.address}</p>
            <p class="history-date-time">${formattedDate} • ${session.startTime}-${session.endTime}</p>
            <p class="history-cost-duration">$${session.cost.toFixed(2)}, ${formatDuration(session.duration)}</p>
            <div class="history-details">
                <div class="detail-item">
                    <img src="resources/parkingIcon.png" alt="Vehicle" class="detail-icon">
                    <span class="detail-text">${session.vehicle}</span>
                </div>
                <div class="detail-item">
                    <img src="resources/locationIcon.png" alt="Spot" class="detail-icon">
                    <span class="detail-text">Spot ${session.spot}</span>
                </div>
                <div class="detail-item">
                    <img src="${isUnpaid ? 'resources/mailIcon.png' : 'resources/Wallet.png'}" alt="${isUnpaid ? 'Status' : 'Payment'}" class="detail-icon">
                    <span class="detail-text">${isUnpaid ? 'Not Paid' : session.paymentMethod}</span>
                </div>
                <div class="detail-item">
                    <img src="resources/bookingIcon.png" alt="ID" class="detail-icon">
                    <span class="detail-text">#${session.parkingId}</span>
                </div>
            </div>
            ${isUnpaid ? `
                <button class="pay-now-btn" data-session-id="${session.id}">
                    Pay $${session.cost.toFixed(2)} Now
                </button>
            ` : ''}
        </div>
    `;
}

function groupByMonth(sessions) {
    const grouped = {};
    sessions.forEach(session => {
        const date = new Date(session.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(session);
    });
    return grouped;
}

function formatMonthHeader(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) {
        return `${h}h`;
    }
    return `${h}h ${m}m`;
}

async function handlePayNow(sessionId) {
    const session = historyData.find(s => s.id === sessionId);
    if (!session) return;

    if (confirm(`Pay $${session.cost.toFixed(2)} for this parking session?`)) {
        try {
            await payForSession(sessionId);
            await loadHistory();
        } catch (error) {
            alert('Error processing payment. Please try again.');
        }
    }
}

