const API_BASE_URL = null;
const USE_API = false;

// Global state
let activeReservations = [];
let upcomingReservations = [];
let pastReservations = [];
let currentTab = 'active';

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
    setupTabs();
    loadReservations();
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
            window.location.href = 'wallet.html';
            break;
        case 'history':
            window.location.href = 'history.html';
            break;
        case 'profile':
            console.log('Profile clicked');
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


function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Content`).classList.add('active');
    renderReservations();
}


async function loadReservations() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            activeReservations = data.active || [];
            upcomingReservations = data.upcoming || [];
            pastReservations = data.past || [];
        } catch (error) {
            console.error('Error loading reservations:', error);
            activeReservations = [];
            upcomingReservations = [];
            pastReservations = [];
        }
    } else {
        activeReservations = [
            {
                id: 1,
                parkingName: 'Downtown Plaza',
                address: '123 Main Street',
                spot: 'R-23',
                vehicle: 'KK12345',
                date: '2025-11-10',
                checkIn: null
            }
        ];
        
        upcomingReservations = [
            {
                id: 2,
                parkingName: 'Downtown Plaza',
                address: '123 Main Street',
                spot: 'R-23',
                vehicle: 'KK12345',
                date: '2025-11-12',
                fee: 'Pay after visit',
                isNonRefundable: true
            },
            {
                id: 3,
                parkingName: 'Downtown Plaza',
                address: '123 Main Street',
                spot: 'R-23',
                vehicle: 'KK12345',
                date: '2025-11-12',
                fee: 'Pay after visit',
                isNonRefundable: true
            }
        ];
        
        pastReservations = [
            {
                id: 4,
                parkingName: 'Downtown Plaza',
                address: '123 Main Street',
                spot: 'R-23',
                vehicle: 'KK12345',
                date: '2025-11-12',
                fee: 8.50,
                isPaid: false
            },
            {
                id: 5,
                parkingName: 'Downtown Plaza',
                address: '123 Main Street',
                spot: 'R-23',
                vehicle: 'KK12345',
                date: '2025-11-12',
                fee: 8.50,
                isPaid: true
            }
        ];
    }
    
    renderReservations();
}

function renderReservations() {
    switch(currentTab) {
        case 'active':
            renderActiveReservations();
            break;
        case 'upcoming':
            renderUpcomingReservations();
            break;
        case 'past':
            renderPastReservations();
            break;
    }
}

function renderActiveReservations() {
    const container = document.getElementById('activeReservations');
    
    if (activeReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No active reservations</h3>
                <p>Your active parking sessions will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activeReservations.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-location">
                    <h4 class="reservation-title">${reservation.parkingName}</h4>
                    <p class="reservation-address">${reservation.address}</p>
                </div>
                <span class="status-badge active">ACTIVE</span>
            </div>
            <div class="reservation-details">
                <div class="detail-row">
                    <span class="detail-label">Spot Number</span>
                    <span class="detail-value">${reservation.spot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vehicle</span>
                    <span class="detail-value">${reservation.vehicle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formatDate(reservation.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Check-in</span>
                    <span class="detail-value">${reservation.checkIn || '----'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderUpcomingReservations() {
    const container = document.getElementById('upcomingReservations');
    
    if (upcomingReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No upcoming reservations</h3>
                <p>Your upcoming reservations will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcomingReservations.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-location">
                    <h4 class="reservation-title">${reservation.parkingName}</h4>
                    <p class="reservation-address">${reservation.address}</p>
                </div>
                <span class="status-badge upcoming">UPCOMING</span>
            </div>
            ${reservation.isNonRefundable ? `
                <div class="non-refundable-notice">
                    <img src="resources/lightbIcon.png" alt="Notice" class="notice-icon">
                    <span class="notice-text">Non-refundable: Reservation fee cannot be cancelled</span>
                </div>
            ` : ''}
            <div class="reservation-details">
                <div class="detail-row">
                    <span class="detail-label">Spot Number</span>
                    <span class="detail-value">${reservation.spot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vehicle</span>
                    <span class="detail-value">${reservation.vehicle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formatDate(reservation.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Parking Fee</span>
                    <span class="detail-value">${reservation.fee || 'Pay after visit'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPastReservations() {
    const container = document.getElementById('pastReservations');
    
    if (pastReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No past reservations</h3>
                <p>Your completed parking sessions will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pastReservations.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-location">
                    <h4 class="reservation-title">${reservation.parkingName}</h4>
                    <p class="reservation-address">${reservation.address}</p>
                </div>
                <span class="status-badge completed">COMPLETED</span>
            </div>
            <div class="reservation-details">
                <div class="detail-row">
                    <span class="detail-label">Spot Number</span>
                    <span class="detail-value">${reservation.spot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vehicle</span>
                    <span class="detail-value">${reservation.vehicle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formatDate(reservation.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Parking Fee</span>
                    <span class="detail-value ${reservation.isPaid ? 'paid' : 'not-paid'}">
                        $${typeof reservation.fee === 'number' ? reservation.fee.toFixed(2) : reservation.fee} 
                        (${reservation.isPaid ? 'Paid' : 'Not paid'})
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

