const API_BASE_URL = null;
const USE_API = false;

let balance = 0;
let unpaidSessions = [];
let activeReservations = [];
let activeSession = null;
let vehicles = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

async function initializeDashboard() {
    try {
        await Promise.all([
            loadBalance(),
            loadUnpaidSessions(),
            loadActiveReservations(),
            loadActiveSession(),
            loadVehicles()
        ]);

        renderBalance();
        renderUnpaidSection();
        renderReservations();
        renderActiveSession();
        renderVehicles();
        updateQuickActions();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

function setupEventListeners() {
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

    const userIconBtn = document.getElementById('userIconBtn');
    if (userIconBtn) {
        userIconBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }

    document.getElementById('topUpBtn').addEventListener('click', function() {
        console.log('Top Up clicked');
    });


    document.getElementById('historyBtn').addEventListener('click', function() {
        console.log('History clicked');
    });


    document.getElementById('payNowBtn').addEventListener('click', function() {
        handlePayNow();
    });


    document.getElementById('addVehicleBtn').addEventListener('click', function() {
        openAddVehicleModal();
    });

    document.getElementById('findParkingCard').addEventListener('click', function() {
        window.location.href = 'search.html';
    });

    document.getElementById('myReservationsCard').addEventListener('click', function() {
        window.location.href = 'reservations.html';
    });

    document.getElementById('walletCard').addEventListener('click', function() {
        window.location.href = 'wallet.html';
    });

    document.getElementById('historyCard').addEventListener('click', function() {
        window.location.href = 'history.html';
    });


    const addVehicleModal = document.getElementById('addVehicleModal');
    const closeVehicleModal = document.getElementById('closeVehicleModal');
    const addVehicleForm = document.getElementById('addVehicleForm');

    closeVehicleModal.addEventListener('click', function() {
        closeAddVehicleModal();
    });

    addVehicleModal.addEventListener('click', function(e) {
        if (e.target === addVehicleModal) {
            closeAddVehicleModal();
        }
    });

    addVehicleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleAddVehicle();
    });

    setupBottomNavigation();
}

function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            handleNavigation(page, this);
        });
    });
}

function handleNavigation(page, clickedItem) {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    

    clickedItem.classList.add('active');

    switch(page) {
        case 'dashboard':

            window.scrollTo({ top: 0, behavior: 'smooth' });
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
            window.location.href = 'profile.html';
            break;
    }
}


async function loadBalance() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            balance = data.balance || 0;
        } catch (error) {
            console.error('Error loading balance:', error);
            balance = 0;
        }
    } else {

        balance = 45.80;
    }
}

async function loadUnpaidSessions() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/parkings/unpaid`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            unpaidSessions = data.sessions || [];
        } catch (error) {
            console.error('Error loading unpaid sessions:', error);
            unpaidSessions = [];
        }
    } else {

        // unpaidSessions = [{
        //     id: 1,
        //     parkingName: 'Downtown Plaza',
        //     date: 'Nov 8',
        //     startTime: '16:15',
        //     endTime: '18:45',
        //     duration: '2h 30m',
        //     amount: 8.50
        // }];
        unpaidSessions = [];
    }
}

async function loadActiveReservations() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations/active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            activeReservations = data.reservations || [];
        } catch (error) {
            console.error('Error loading active reservations:', error);
            activeReservations = [];
        }
    } else {
        activeReservations = [
            {
                id: 1,
                parkingName: 'Downtown Plaza',
                date: 'Nov 10, 14:00',
                spot: 'A-23',
                duration: '2 hours'
            },
            {
                id: 2,
                parkingName: 'Downtown Plaza',
                date: 'Nov 10, 14:00',
                spot: 'A-23',
                duration: '2 hours'
            },
            {
                id: 3,
                parkingName: 'Downtown Plaza',
                date: 'Nov 10, 14:00',
                spot: 'A-23',
                duration: '2 hours'
            }
        ];
    }
}

async function loadActiveSession() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/parkings/active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            activeSession = data.session || null;
        } catch (error) {
            console.error('Error loading active session:', error);
            activeSession = null;
        }
    } else {

        //activeSession = null;

        activeSession = {
            id: 1,
            parkingName: 'Downtown Plaza',
            arrival: 'Nov 10, 14:00',
            vehicle: 'KK971PL',
            spot: 'A-23'
        };
    }
}

async function loadVehicles() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicles`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            vehicles = data.vehicles || [];
        } catch (error) {
            console.error('Error loading vehicles:', error);
            vehicles = [];
        }
    } else {

        vehicles = [
            { id: 1, plate: 'KK971PL' },
            { id: 2, plate: 'WA12345' }
        ];
    }
}

async function addVehicle(plate) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plate: plate.toUpperCase() })
            });

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('Vehicle with this plate already exists');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.vehicle;
        } catch (error) {
            console.error('Error adding vehicle:', error);
            throw error;
        }
    } else {

        await new Promise(resolve => setTimeout(resolve, 500));
        const newVehicle = {
            id: vehicles.length + 1,
            plate: plate.toUpperCase()
        };
        vehicles.push(newVehicle);
        return newVehicle;
    }
}

async function deleteVehicle(vehicleId) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            throw error;
        }
    } else {

        vehicles = vehicles.filter(v => v.id !== vehicleId);
        return true;
    }
}


function renderBalance() {
    document.getElementById('balanceAmount').textContent = `$${balance.toFixed(2)}`;
}

function renderUnpaidSection() {
    const unpaidSection = document.getElementById('unpaidSection');
    
    if (unpaidSessions.length === 0) {
        unpaidSection.style.display = 'none';
        return;
    }

    unpaidSection.style.display = 'block';
    const session = unpaidSessions[0];
    
    document.getElementById('unpaidDetails').textContent = 
        `${session.parkingName} • ${session.date}, ${session.startTime}-${session.endTime} • ${session.duration}`;
    document.getElementById('unpaidAmount').textContent = `Amount Due: $${session.amount.toFixed(2)}`;
}

function renderReservations() {
    const scrollContainer = document.getElementById('reservationsScroll');
    const noReservations = document.getElementById('noReservations');

    if (activeReservations.length === 0) {
        scrollContainer.style.display = 'none';
        noReservations.style.display = 'block';
        return;
    }

    scrollContainer.style.display = 'flex';
    noReservations.style.display = 'none';

    scrollContainer.innerHTML = activeReservations.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-item">
                <span class="reservation-label">Parking:</span>
                <span class="reservation-value">${reservation.parkingName}</span>
            </div>
            <div class="reservation-item">
                <span class="reservation-label">Date:</span>
                <span class="reservation-value">${reservation.date}</span>
            </div>
            <div class="reservation-item">
                <span class="reservation-label">Spot:</span>
                <span class="reservation-value">${reservation.spot}</span>
            </div>
            <div class="reservation-item">
                <span class="reservation-label">Duration:</span>
                <span class="reservation-value">${reservation.duration}</span>
            </div>
            <button class="reservation-btn" data-id="${reservation.id}">Parking details</button>
        </div>
    `).join('');


    scrollContainer.querySelectorAll('.reservation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            console.log('Reservation details clicked:', reservationId);

        });
    });
}

function renderActiveSession() {
    const activeSessionSection = document.getElementById('activeSessionSection');
    const activeSessionCard = document.getElementById('activeSessionCard');

    if (!activeSession) {
        activeSessionSection.style.display = 'none';
        return;
    }

    activeSessionSection.style.display = 'block';
    activeSessionCard.innerHTML = `
        <div class="session-item">
            <span class="session-label">Parking:</span>
            <span class="session-value">${activeSession.parkingName}</span>
        </div>
        <div class="session-item">
            <span class="session-label">Arrival:</span>
            <span class="session-value">${activeSession.arrival}</span>
        </div>
        <div class="session-item">
            <span class="session-label">Vehicle:</span>
            <span class="session-value">${activeSession.vehicle}</span>
        </div>
        <div class="session-item">
            <span class="session-label">Spot:</span>
            <span class="session-value">${activeSession.spot}</span>
        </div>
        <button class="session-btn" data-id="${activeSession.id}">Parking details</button>
    `;

    activeSessionCard.querySelector('.session-btn').addEventListener('click', function() {
        const sessionId = this.getAttribute('data-id');
        console.log('Session details clicked:', sessionId);

    });
}

function renderVehicles() {
    const vehiclesList = document.getElementById('vehiclesList');
    
    vehiclesList.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-item">
            <span class="vehicle-plate">${vehicle.plate}</span>
            <div class="vehicle-actions">
                <button class="vehicle-action-btn edit-vehicle" data-id="${vehicle.id}">
                    <img src="resources/pencilIcon.png" alt="Edit" class="vehicle-action-icon">
                </button>
                <button class="vehicle-action-btn delete-vehicle" data-id="${vehicle.id}">
                    <img src="resources/IconTrash.png" alt="Delete" class="vehicle-action-icon">
                </button>
            </div>
        </div>
    `).join('');


    vehiclesList.querySelectorAll('.edit-vehicle').forEach(btn => {
        btn.addEventListener('click', function() {
            const vehicleId = parseInt(this.getAttribute('data-id'));
            console.log('Edit vehicle:', vehicleId);
        });
    });

    vehiclesList.querySelectorAll('.delete-vehicle').forEach(btn => {
        btn.addEventListener('click', async function() {
            const vehicleId = parseInt(this.getAttribute('data-id'));
            if (confirm('Are you sure you want to delete this vehicle?')) {
                try {
                    await deleteVehicle(vehicleId);
                    await loadVehicles();
                    renderVehicles();
                } catch (error) {
                    alert('Error deleting vehicle. Please try again.');
                }
            }
        });
    });
}

function updateQuickActions() {
    document.getElementById('walletBalance').textContent = `$${balance.toFixed(2)}`;
}

function openAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('vehiclePlateInput').focus();
}

function closeAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('addVehicleForm').reset();
    document.getElementById('vehicleErrorMessage').style.display = 'none';
}

async function handleAddVehicle() {
    const plateInput = document.getElementById('vehiclePlateInput');
    const errorMessage = document.getElementById('vehicleErrorMessage');
    const submitBtn = document.getElementById('submitVehicleBtn');
    
    const plate = plateInput.value.trim().toUpperCase();
    
    if (!plate) {
        errorMessage.textContent = 'Please enter a license plate';
        errorMessage.style.display = 'block';
        return;
    }

    if (plate.length < 2 || plate.length > 10) {
        errorMessage.textContent = 'License plate must be between 2 and 10 characters';
        errorMessage.style.display = 'block';
        return;
    }

    if (vehicles.some(v => v.plate === plate)) {
        errorMessage.textContent = 'This vehicle is already registered';
        errorMessage.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    errorMessage.style.display = 'none';

    try {
        await addVehicle(plate);
        await loadVehicles();
        renderVehicles();
        closeAddVehicleModal();
    } catch (error) {
        errorMessage.textContent = error.message || 'Error adding vehicle. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Vehicle';
    }
}

async function handlePayNow() {
    if (unpaidSessions.length === 0) return;

    const session = unpaidSessions[0];
    console.log('Pay Now clicked for session:', session.id);
    

    if (confirm(`Pay $${session.amount.toFixed(2)} for parking session?`)) {

        await loadUnpaidSessions();
        renderUnpaidSection();
    }
}

