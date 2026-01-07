// API module is loaded from api.js

let balance = 0;
let unpaidSessions = [];
let activeReservations = [];
let activeSession = null;
let vehicles = [];

let selectedAmount = 10;
let selectedPaymentMethod = 'blik';
let isCustomAmount = false;
let editingVehicleId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authorization before executing any requests
    if (!api.isTokenValid()) {
        api.redirectToLogin();
        return; // Don't load the page
    }
    
    initializeDashboard();
    setupEventListeners();
});

async function initializeDashboard() {
    try {
        // Use Promise.allSettled() instead of Promise.all() to handle partial failures gracefully
        const results = await Promise.allSettled([
            loadBalance(),
            loadUnpaidSessions(),
            loadActiveReservations(),
            loadActiveSession(),
            loadVehicles()
        ]);

        // Check for 401 errors and redirect if needed
        let hasUnauthorizedError = false;
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const error = result.reason;
                if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                    hasUnauthorizedError = true;
                } else {
                    console.error(`Error loading data ${index}:`, error);
                }
            }
        });

        if (hasUnauthorizedError) {
            api.redirectToLogin();
            return;
        }

        // Render data that was successfully loaded
        renderBalance();
        renderUnpaidSection();
        renderReservations();
        renderActiveSession();
        renderVehicles();
        updateQuickActions();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            api.redirectToLogin();
        }
    }
}

function setupEventListeners() {
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

    const userIconBtn = document.getElementById('userIconBtn');
    if (userIconBtn) {
        userIconBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }

    setupTopUpModal();

    document.getElementById('historyBtn').addEventListener('click', function() {
        window.location.href = 'history.html';
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
    const editVehicleModal = document.getElementById('editVehicleModal');
    const closeEditVehicleModal = document.getElementById('closeEditVehicleModal');
    const editVehicleForm = document.getElementById('editVehicleForm');

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

    closeEditVehicleModal.addEventListener('click', function() {
        closeEditVehicleModalFunc();
    });

    editVehicleModal.addEventListener('click', function(e) {
        if (e.target === editVehicleModal) {
            closeEditVehicleModalFunc();
        }
    });

    editVehicleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleEditVehicle();
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
    try {
        // Note: This endpoint needs to be implemented in customer-service
        // For now, try to get wallet balance
        const data = await api.get('/customer/wallet');
        // Backend returns balance_minor (in cents), convert to dollars
        balance = data.balance_minor ? parseFloat(data.balance_minor) / 100 : 0;
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading balance:', error);
        balance = 0;
    }
}

async function loadUnpaidSessions() {
    try {
        // Note: This endpoint needs to be implemented in customer-service or parking-service
        // For now, return empty array
        unpaidSessions = [];
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading unpaid sessions:', error);
        unpaidSessions = [];
    }
}

async function loadActiveReservations() {
    try {
        const data = await api.get('/customer/reservations');
        // Backend returns List<Map>, filter active reservations
        if (Array.isArray(data)) {
            const now = new Date();
            activeReservations = data
                .filter(r => {
                    // Filter by status='Paid' and end_time > now()
                    const status = r.status || r.status_reservation;
                    const endTime = r.end_time ? new Date(r.end_time) : (r.valid_until ? new Date(r.valid_until) : null);
                    return status === 'Paid' && endTime && endTime > now;
                })
                .map(r => {
                    const endTime = r.end_time ? new Date(r.end_time) : (r.valid_until ? new Date(r.valid_until) : null);
                    return {
                        id: r.id || r.id_reservation || r.reservation_id,
                        parkingId: r.id_parking || r.parking_id || r.parkingId,
                        parkingName: r.parkingName || r.name_parking || r.location_name || 'Unknown',
                        date: endTime ? endTime.toLocaleString() : '',
                        spot: r.spot_code || r.spotCode || r.id_spot || 'Unknown',
                        duration: r.duration || 'N/A'
                    };
                });
        } else {
            activeReservations = data.reservations || [];
        }
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading active reservations:', error);
        activeReservations = [];
    }
}

async function loadActiveSession() {
    try {
        // Note: This endpoint needs to be implemented in customer-service or parking-service
        // For now, return null
        activeSession = null;
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading active session:', error);
        activeSession = null;
    }
}

async function loadVehicles() {
    try {
        const data = await api.get('/customer/vehicles');
        // Backend returns List<Map>, transform to array of objects
        if (Array.isArray(data)) {
            vehicles = data.map(v => ({
                id: v.id || v.vehicle_id,
                plate: v.plate || v.licence_plate || v.licencePlate
            }));
        } else {
            vehicles = data.vehicles || [];
        }
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw error; // Re-throw to be handled by Promise.allSettled
        }
        console.error('Error loading vehicles:', error);
        vehicles = [];
    }
}

async function addVehicle(plate) {
    try {
        const params = new URLSearchParams();
        params.append('licencePlate', plate.toUpperCase());
        
        const data = await api.post(`/customer/vehicles?${params.toString()}`, null);
        
        return {
            id: data.id,
            plate: plate.toUpperCase()
        };
    } catch (error) {
        console.error('Error adding vehicle:', error);
        if (error.message.includes('409') || error.message.includes('already exists')) {
            throw new Error('Vehicle with this plate already exists');
        }
        throw error;
    }
}

async function deleteVehicle(vehicleId) {
    try {
        // Note: This endpoint needs to be implemented in customer-service
        await api.delete(`/customer/vehicles/${vehicleId}`);
        return true;
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
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
            <button class="reservation-btn" data-id="${reservation.id}" data-parking-id="${reservation.parkingId || ''}">Parking details</button>
        </div>
    `).join('');


    scrollContainer.querySelectorAll('.reservation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            const parkingId = this.getAttribute('data-parking-id');
            console.log('Reservation details clicked:', reservationId, 'parkingId:', parkingId);
            
            // Navigate to search page with parking details
            if (parkingId) {
                window.location.href = `search.html?parkingId=${parkingId}`;
            } else {
                // Fallback: navigate to search page without specific parking
                window.location.href = 'search.html';
            }
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
            openEditVehicleModal(vehicleId);
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

function openEditVehicleModal(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        alert('Vehicle not found');
        return;
    }
    
    editingVehicleId = vehicleId;
    const modal = document.getElementById('editVehicleModal');
    const plateInput = document.getElementById('editVehiclePlateInput');
    
    plateInput.value = vehicle.plate;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    plateInput.focus();
}

function closeEditVehicleModalFunc() {
    const modal = document.getElementById('editVehicleModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('editVehicleForm').reset();
    document.getElementById('editVehicleErrorMessage').style.display = 'none';
    editingVehicleId = null;
}

async function updateVehicle(vehicleId, plate) {
    try {
        const params = new URLSearchParams();
        params.append('licencePlate', plate.toUpperCase());
        
        await api.put(`/customer/vehicles/${vehicleId}?${params.toString()}`, null);
        return { success: true };
    } catch (error) {
        console.error('Error updating vehicle:', error);
        if (error.message.includes('409') || error.message.includes('already exists')) {
            throw new Error('Vehicle with this plate already exists');
        }
        throw error;
    }
}

async function handleEditVehicle() {
    const plateInput = document.getElementById('editVehiclePlateInput');
    const errorMessage = document.getElementById('editVehicleErrorMessage');
    const submitBtn = document.getElementById('submitEditVehicleBtn');
    
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

    // Check if plate already exists (excluding current vehicle)
    if (vehicles.some(v => v.plate === plate && v.id !== editingVehicleId)) {
        errorMessage.textContent = 'This vehicle is already registered';
        errorMessage.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    errorMessage.style.display = 'none';

    try {
        await updateVehicle(editingVehicleId, plate);
        await loadVehicles();
        renderVehicles();
        closeEditVehicleModalFunc();
    } catch (error) {
        errorMessage.textContent = error.message || 'Error updating vehicle. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
    }
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
        // Reload balance to get updated value from backend
        await loadBalance();
        renderBalance();
        updateQuickActions();
    } catch (error) {
        errorMessage.textContent = error.message || 'Error processing top up. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        updateTopUpButton();
    }
}

