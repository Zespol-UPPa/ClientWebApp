
// API module is loaded from api.js

// Sample data removed - using real API data

let parkingData = [];
let currentFilter = 'all';
let searchQuery = '';
let isLoading = false;

/**
 * Formatuje cenę zgodnie z walutą
 * @param {number} amount - Kwota w głównej jednostce waluty
 * @param {string} currency - Kod waluty (PLN, USD, EUR, etc.)
 * @returns {string} Sformatowana cena z symbolem waluty
 */
function formatPrice(amount, currency) {
    const formatted = amount.toFixed(2);
    switch (currency) {
        case 'PLN':
            return `${formatted} zł`;
        case 'USD':
            return `$${formatted}`;
        case 'EUR':
            return `€${formatted}`;
        default:
            return `${formatted} ${currency}`;
    }
}

/**
 * Ładuje parkingi z API lub zwraca dane statyczne
 * @param {string} location - Lokalizacja do wyszukania (opcjonalne)
 * @returns {Promise<Array>} Tablica parkingów
 */
async function loadParkings(location = null) {
    try {
        isLoading = true;
        showLoadingState();
        
        // Load parking locations from parking-service (public endpoint, no auth required)
        let url = '/parking/locations';
        if (location) {
            url += `?location=${encodeURIComponent(location)}`;
        }
        
        const data = await api.get(url, false); // No auth required
        isLoading = false;
        
        // Transform backend data to frontend format
        if (Array.isArray(data)) {
            return data.map(p => {
                // Backend returns: id_parking, name_parking, address_line, total_spots, available_spots, 
                // price_per_hour_minor, currency_code, reservation_fee_minor, rate_per_min, free_minutes, rounding_step_min
                const pricePerHourMinor = p.price_per_hour_minor || 0;
                const currency = p.currency_code || 'PLN';
                const pricePerHour = pricePerHourMinor / 100; // Convert from minor units (grosze/cents) to main unit
                
                return {
                    id: p.id_parking || p.id || p.location_id,
                    name: p.name_parking || p.name || p.location_name || 'Unknown',
                    address: p.address_line || p.address || p.location_address || '',
                    availableSpots: p.available_spots || 0,
                    totalSpots: p.total_spots || 0,
                    occupiedSpots: p.occupied_spots || 0,
                    pricePerHour: pricePerHour,
                    currency: currency,
                    reservationFeeMinor: p.reservation_fee_minor || 0,
                    ratePerMin: p.rate_per_min || 0,
                    freeMinutes: p.free_minutes || 0,
                    roundingStepMin: p.rounding_step_min || 0,
                    isAvailable: (p.available_spots || 0) > 0
                };
            });
        }
        
        return [];
    } catch (error) {
        console.error('Error loading parkings from API:', error);
        isLoading = false;
        showErrorState('Failed to load parkings. Please try again later.');
        return [];
    }
}

/**
 * Odświeża dane parkingów (np. po zmianie lokalizacji)
 */
async function refreshParkings() {
    const location = document.getElementById('searchInput')?.value || null;
    parkingData = await loadParkings(location);
    filterAndRender();
}


function showLoadingState() {
    const container = document.getElementById('parkingContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Loading parkings...</h3>
                <p>Please wait</p>
            </div>
        `;
    }
}

function showErrorState(message) {
    const container = document.getElementById('parkingContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}


document.addEventListener('DOMContentLoaded', async function() {
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

    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const parkingContainer = document.getElementById('parkingContainer');
    setupBottomNavigation();
    
    // Load initial parking data
    parkingData = await loadParkings();
    renderParkings(parkingData);
    
    // Check for parkingId in URL params and open modal if present
    const urlParams = new URLSearchParams(window.location.search);
    const parkingIdParam = urlParams.get('parkingId');
    if (parkingIdParam) {
        const parkingId = parseInt(parkingIdParam);
        if (!isNaN(parkingId)) {
            const parking = parkingData.find(p => p.id === parkingId);
            if (parking) {
                // Small delay to ensure modal handlers are set up
                setTimeout(() => {
                    handleDetailsClick(parkingId);
                }, 100);
            }
        }
    }

    parkingData = await loadParkings();
    renderParkings(parkingData);

    
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRender();
        
        //automatyczne odświeżanie z API przy zmianie lokalizacji

    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterAndRender();
        });
    });

    function filterAndRender() {
        let filtered = [...parkingData];

        if (searchQuery) {
            filtered = filtered.filter(parking => 
                parking.name.toLowerCase().includes(searchQuery) ||
                parking.address.toLowerCase().includes(searchQuery)
            );
        }

        if (currentFilter === 'available') {
            filtered = filtered.filter(parking => parking.isAvailable && parking.availableSpots > 0);
        }

        renderParkings(filtered);
    }

    function renderParkings(parkings) {
        if (parkings.length === 0) {
            parkingContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No parkings found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        parkingContainer.innerHTML = parkings.map(parking => `
            <div class="parking-card" data-id="${parking.id}">
                <div class="parking-card-header">
                    <h3 class="parking-name">${parking.name}</h3>
                    <img src="resources/parkingIcon.png" alt="Map" class="map-icon">
                </div>
                <div class="parking-address">
                    <img src="resources/locationIcon.png" alt="Location" class="location-icon">
                    <span>${parking.address}</span>
                </div>
                <div class="parking-info">
                    <div class="info-row">
                        <img src="resources/checkIcon.png" alt="Available" class="info-icon">
                        <span class="available-spots">${parking.availableSpots} spots available</span>
                    </div>
                    <div class="info-row">
                        <img src="resources/moneyIcon.png" alt="Price" class="info-icon">
                        <span class="price">${formatPrice(parking.pricePerHour, parking.currency)}/hour</span>
                    </div>
                </div>
                <div class="card-buttons">
                    <button class="details-btn">Details</button>
                    ${isUserLoggedIn() ? `<button class="reserve-btn">Reserve now</button>` : ''}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.parking-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.classList.contains('map-icon') || 
                    e.target.classList.contains('details-btn') || 
                    e.target.classList.contains('reserve-btn')) {
                    return;
                }
                const parkingId = parseInt(this.getAttribute('data-id'));
                handleParkingClick(parkingId);
            });
        });

        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const card = this.closest('.parking-card');
                const parkingId = parseInt(card.getAttribute('data-id'));
                handleDetailsClick(parkingId);
            });
        });

        document.querySelectorAll('.map-icon').forEach(icon => {
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                const card = this.closest('.parking-card');
                const parkingId = parseInt(card.getAttribute('data-id'));
                handleMapClick(parkingId);
            });
        });
        if (isUserLoggedIn()) {
            document.querySelectorAll('.reserve-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.parking-card');
                    const parkingId = parseInt(card.getAttribute('data-id'));
                    handleReserveClick(parkingId);
                });
            });
        }
    }

    function handleParkingClick(parkingId) {
        const parking = parkingData.find(p => p.id === parkingId);
        console.log('Parking clicked:', parking);

    }

    async function handleDetailsClick(parkingId) {
        const parking = parkingData.find(p => p.id === parkingId);
        if (parking) {
            openParkingModal(parking);
        }
    }

    function handleMapClick(parkingId) {
        const parking = parkingData.find(p => p.id === parkingId);
        console.log('Map clicked for:', parking);

    }

    function handleReserveClick(parkingId) {
        const parking = parkingData.find(p => p.id === parkingId);
        if (parking) {
            openReserveModal(parking);
        }
    }
    
    // automatyczne odświeżanie danych co X sekund
    // setInterval(refreshParkings, 30000); // Odśwież co 30 sekund !!!!
});


let chartCanvas = null;
let chartContext = null;

/**
 * Otwiera modal z detalami parkingu
 */
async function openParkingModal(parking) {
    const modal = document.getElementById('parkingModal');
    const modalName = document.getElementById('modalParkingName');
    const modalAddress = document.getElementById('modalAddress');
    const modalTotalSpots = document.getElementById('modalTotalSpots');
    const modalAvailableSpots = document.getElementById('modalAvailableSpots');
    const modalRate = document.getElementById('modalRate');

    // Try to load fresh details from API, fallback to cached data
    try {
        const details = await api.get(`/parking/locations/${parking.id}/details`, false);
        if (details) {
            parking.totalSpots = details.total_spots || parking.totalSpots;
            parking.availableSpots = details.available_spots || parking.availableSpots;
            parking.occupiedSpots = details.occupied_spots || parking.occupiedSpots || 0;
            const pricePerHourMinor = details.price_per_hour_minor || 0;
            parking.pricePerHour = pricePerHourMinor / 100; // Convert from minor units to main unit
            parking.currency = details.currency_code || parking.currency || 'PLN';
            parking.reservationFeeMinor = details.reservation_fee_minor || parking.reservationFeeMinor || 0;
            parking.ratePerMin = details.rate_per_min || parking.ratePerMin || 0;
            parking.freeMinutes = details.free_minutes || parking.freeMinutes || 0;
            parking.roundingStepMin = details.rounding_step_min || parking.roundingStepMin || 0;
        }
    } catch (error) {
        console.warn('Failed to load parking details, using cached data:', error);
    }

    modalName.textContent = parking.name;
    modalAddress.textContent = parking.address;
    modalTotalSpots.textContent = parking.totalSpots || 0;
    modalAvailableSpots.textContent = `${parking.availableSpots || 0} spots`;
    modalRate.textContent = `${formatPrice(parking.pricePerHour || 0, parking.currency || 'PLN')}/hour`;
    
    // Wyświetl informacje o darmowych minutach i zaokrągleniu
    const modalFreeMinutes = document.getElementById('modalFreeMinutes');
    const modalRoundingStep = document.getElementById('modalRoundingStep');
    if (modalFreeMinutes) {
        modalFreeMinutes.textContent = `${parking.freeMinutes || 0} minutes`;
    }
    if (modalRoundingStep) {
        modalRoundingStep.textContent = `${parking.roundingStepMin || 0} minutes`;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    await loadAndDrawChart(parking.id);

    setupModalCloseHandlers();
}

/**
 * Konfiguruje obsługę zamknięcia modala
 */
function setupModalCloseHandlers() {
    const modal = document.getElementById('parkingModal');
    const closeBtn = document.getElementById('modalCloseBtn');

    closeBtn.onclick = closeParkingModal;
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeParkingModal();
        }
    };

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeParkingModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

/**
 * Zamyka modal z detalami parkingu
 */
function closeParkingModal() {
    const modal = document.getElementById('parkingModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (chartContext) {
        chartContext.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }
}

/**
 * Ładuje dane wykresu z API
 */
async function loadChartData(parkingId) {
    try {
        const data = await api.get(`/parking/locations/${parkingId}/occupancy`, false); // No auth required
        // Backend returns: normal, peak, hours, total_spots, available_spots, day_of_week
        return {
            normal: data.normal || [25, 40, 55, 70, 75, 70, 60, 50, 35],
            peak: data.peak || [45, 65, 80, 90, 95, 90, 80, 70, 50],
            hours: data.hours || ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
            dayOfWeek: data.day_of_week || 'Today'
        };
    } catch (error) {
        console.error('Error loading chart data from API:', error);
        // Fallback to sample data if API fails
        return {
            normal: [25, 40, 55, 70, 75, 70, 60, 50, 35],
            peak: [45, 65, 80, 90, 95, 90, 80, 70, 50],
            hours: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
            dayOfWeek: 'Today'
        };
    }
}

/**
 * Ładuje dane i rysuje wykres
 */
async function loadAndDrawChart(parkingId) {
    const canvas = document.getElementById('occupancyChart');
    if (!canvas) return;

    chartCanvas = canvas;
    chartContext = canvas.getContext('2d');

    const container = canvas.parentElement;
    container.style.opacity = '0.5';

    const chartData = await loadChartData(parkingId);
    
    // Zaktualizuj tytuł wykresu z informacją o dniu tygodnia
    const chartTitle = document.getElementById('chartTitle') || document.querySelector('.chart-title');
    if (chartTitle && chartData.dayOfWeek) {
        chartTitle.textContent = `Typical occupancy by hour (${chartData.dayOfWeek})`;
    }
    
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    chartContext.scale(dpr, dpr);

    drawChart(chartContext, chartData, rect.width, rect.height);
    
    container.style.opacity = '1';
    
    let savedChartData = chartData;
    const resizeHandler = function() {
        if (chartCanvas && chartContext && savedChartData) {
            const newRect = container.getBoundingClientRect();
            const newDpr = window.devicePixelRatio || 1;
            canvas.width = newRect.width * newDpr;
            canvas.height = newRect.height * newDpr;
            canvas.style.width = newRect.width + 'px';
            canvas.style.height = newRect.height + 'px';
            const newCtx = canvas.getContext('2d');
            newCtx.scale(newDpr, newDpr);
            drawChart(newCtx, savedChartData, newRect.width, newRect.height);
            chartContext = newCtx;
        }
    };
    
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
}
function drawChart(ctx, data, width, height) {
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(
        ...data.normal,
        ...data.peak
    );

    const scaleX = (index) => padding.left + (index / (data.hours.length - 1)) * chartWidth;
    const scaleY = (value) => padding.top + chartHeight - (value / maxValue) * chartHeight;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
    }

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.normal.forEach((value, index) => {
        const x = scaleX(index);
        const y = scaleY(value);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    ctx.fillStyle = '#3b82f6';
    data.normal.forEach((value, index) => {
        const x = scaleX(index);
        const y = scaleY(value);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.peak.forEach((value, index) => {
        const x = scaleX(index);
        const y = scaleY(value);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    data.peak.forEach((value, index) => {
        const x = scaleX(index);
        const y = scaleY(value);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.hours.forEach((hour, index) => {
        const x = scaleX(index);
        ctx.fillText(hour, x, padding.top + chartHeight + 8);
    });
}


function isUserLoggedIn() {
    return api.isTokenValid();
}

function setupBottomNavigation() {
    const loggedInNav = document.getElementById('loggedInNav');
    const loggedOutNav = document.getElementById('loggedOutNav');
    const loggedInNavHeader = document.getElementById('loggedInNavHeader');
    const loggedOutNavHeader = document.getElementById('loggedOutNavHeader');
    const isLoggedIn = isUserLoggedIn();

    if (isLoggedIn) {
        loggedInNav.style.display = 'flex';
        loggedOutNav.style.display = 'none';
        loggedInNavHeader.style.display = 'block';
        loggedOutNavHeader.style.display = 'none';
        setupLoggedInNavigation();
        setupLoggedInHeader();
    } else {
        loggedInNav.style.display = 'none';
        loggedOutNav.style.display = 'flex';
        loggedInNavHeader.style.display = 'none';
        loggedOutNavHeader.style.display = 'flex';
        setupLoggedOutNavigation();
    }
}

function setupLoggedInNavigation() {
    const navItems = document.querySelectorAll('.logged-in-nav .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            handleLoggedInNavigation(page, this);
        });
    });
}

function handleLoggedInNavigation(page, clickedItem) {
    document.querySelectorAll('.logged-in-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');
    switch(page) {
        case 'dashboard':
            window.location.href = 'dashboard.html';
            break;
        case 'parking':

            window.scrollTo({ top: 0, behavior: 'smooth' });
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

function setupLoggedOutNavigation() {
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
    }


    const getStartedBtn = document.querySelector('.get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
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


let vehicles = [];

async function openReserveModal(parking) {
    const modal = document.getElementById('reserveModal');
    const parkingLocationInput = document.getElementById('reserveParkingLocation');
    const vehicleSelect = document.getElementById('reserveVehicleSelect');
    const dateInput = document.getElementById('reserveDateInput');
    const timeInput = document.getElementById('reserveTimeInput');
    const closeBtn = document.getElementById('closeReserveModal');
    const reserveForm = document.getElementById('reserveForm');

    parkingLocationInput.value = parking.name;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate;
    
    // Set default time to 09:00
    if (timeInput) {
        timeInput.value = '09:00';
    }

    await loadVehicles();
    populateVehicleSelect();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    closeBtn.onclick = closeReserveModal;
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeReserveModal();
        }
    };

    reserveForm.onsubmit = async function(e) {
        e.preventDefault();
        await handleReserveSubmit(parking);
    };
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeReserveModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeReserveModal() {
    const modal = document.getElementById('reserveModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('reserveForm').reset();
    document.getElementById('reserveErrorMessage').style.display = 'none';
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
            api.redirectToLogin();
            return;
        }
        console.error('Error loading vehicles:', error);
        vehicles = [];
    }
}

function populateVehicleSelect() {
    const vehicleSelect = document.getElementById('reserveVehicleSelect');
    vehicleSelect.innerHTML = '<option value="">Choose a vehicle...</option>';
    
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = vehicle.plate;
        vehicleSelect.appendChild(option);
    });
}

async function handleReserveSubmit(parking) {
    const vehicleSelect = document.getElementById('reserveVehicleSelect');
    const dateInput = document.getElementById('reserveDateInput');
    const timeInput = document.getElementById('reserveTimeInput');
    const errorMessage = document.getElementById('reserveErrorMessage');
    const confirmBtn = document.getElementById('confirmPayBtn');

    const vehicleId = parseInt(vehicleSelect.value);
    const date = dateInput.value;
    const time = timeInput ? timeInput.value : null;
    
    if (!vehicleId) {
        errorMessage.textContent = 'Please select a vehicle';
        errorMessage.style.display = 'block';
        return;
    }

    if (!date) {
        errorMessage.textContent = 'Please select a date';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (!time) {
        errorMessage.textContent = 'Please select a time';
        errorMessage.style.display = 'block';
        return;
    }
    
    const selectedDateTime = new Date(date + 'T' + time);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDateTime < tomorrow) {
        errorMessage.textContent = 'Reservations can only be made for tomorrow or later';
        errorMessage.style.display = 'block';
        return;
    }

    errorMessage.style.display = 'none';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    // Use reservation fee from parking data if available, otherwise fetch from API
    let reservationFeeMinor = parking.reservationFeeMinor || 0;
    const currency = parking.currency || 'PLN';
    
    if (reservationFeeMinor === 0) {
        try {
            // Fetch reservation fee from backend if not in parking data
            const feeResponse = await api.get(`/parking/pricing/${parking.id}/reservation-fee`, false);
            reservationFeeMinor = feeResponse.reservationFeeMinor || 0;
        } catch (error) {
            console.error('Error fetching reservation fee:', error);
            // Use default fee if API fails
            reservationFeeMinor = currency === 'PLN' ? 1000 : 500; // 10.00 PLN or 5.00 USD default
        }
    }
    
    try {
        await createReservation({
            parkingId: parking.id,
            vehicleId: vehicleId,
            date: date,
            time: time,
            reservationFeeMinor: reservationFeeMinor
        });
        
        closeReserveModal();
        alert('Reservation created successfully!');
    } catch (error) {
        errorMessage.textContent = error.message || 'Error creating reservation. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        const feeAmount = reservationFeeMinor / 100;
        const feeText = formatPrice(feeAmount, currency);
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Confirm & Pay ${feeText}`;
    }
}

async function createReservation(reservationData) {
    try {
        // Customer-service expects: parkingId, spotId, startDateTime, durationSeconds (optional, default 7200)
        // reservationData has: parkingId, vehicleId, date, time, reservationFeeMinor
        const params = new URLSearchParams();
        params.append('parkingId', reservationData.parkingId);
        
        // For now, use spotId 1 (this should be selected by user or auto-assigned)
        // TODO: Implement spot selection
        params.append('spotId', reservationData.spotId || '1');
        
        // Format startDateTime as ISO-8601: "2026-01-07T14:00:00Z" (UTC)
        // Instant.parse() requires timezone information, so we add 'Z' for UTC
        if (reservationData.date && reservationData.time) {
            const startDateTime = reservationData.date + 'T' + reservationData.time + ':00Z';
            params.append('startDateTime', startDateTime);
        }
        
        // Calculate duration in seconds (default 2 hours = 7200 seconds)
        const durationSeconds = reservationData.durationSeconds || 7200;
        params.append('durationSeconds', durationSeconds.toString());
        
        const data = await api.post(`/customer/reservations?${params.toString()}`, null);
        return { success: true, reservationId: data.id };
    } catch (error) {
        console.error('Error creating reservation:', error);
        if (error.message.includes('402') || error.message.includes('Insufficient')) {
            throw new Error('Insufficient wallet balance');
        }
        if (error.message.includes('409') || error.message.includes('already')) {
            throw new Error('You already have a reservation for this date');
        }
        throw error;
    }
}

