
const API_BASE_URL = null;
const USE_API = false;

const SAMPLE_PARKING_DATA = [
    {
        id: 1,
        name: "Downtown Plaza",
        address: "123 Main Street",
        availableSpots: 42,
        totalSpots: 100,
        pricePerHour: 4.25,
        isAvailable: true
    },
    {
        id: 2,
        name: "Central Mall Parking",
        address: "456 Shopping Avenue",
        availableSpots: 30,
        totalSpots: 80,
        pricePerHour: 3.50,
        isAvailable: true
    },
    {
        id: 3,
        name: "University Campus",
        address: "789 Education Boulevard",
        availableSpots: 0,
        totalSpots: 50,
        pricePerHour: 2.75,
        isAvailable: false
    },
    {
        id: 4,
        name: "City Center Garage",
        address: "321 Business District",
        availableSpots: 15,
        totalSpots: 120,
        pricePerHour: 5.00,
        isAvailable: true
    },
    {
        id: 5,
        name: "Riverside Parking",
        address: "654 Waterfront Road",
        availableSpots: 8,
        totalSpots: 30,
        pricePerHour: 3.00,
        isAvailable: true
    },
    {
        id: 6,
        name: "Station Square",
        address: "987 Transit Way",
        availableSpots: 0,
        totalSpots: 60,
        pricePerHour: 4.50,
        isAvailable: false
    },
    {
        id: 7,
        name: "Park Avenue Lot",
        address: "147 Green Street",
        availableSpots: 25,
        totalSpots: 40,
        pricePerHour: 3.75,
        isAvailable: true
    },
    {
        id: 8,
        name: "Market Street Garage",
        address: "258 Commerce Lane",
        availableSpots: 12,
        totalSpots: 90,
        pricePerHour: 4.00,
        isAvailable: true
    }
];

let parkingData = [];
let currentFilter = 'all';
let searchQuery = '';
let isLoading = false;

/**
 * Ładuje parkingi z API lub zwraca dane statyczne
 * @param {string} location - Lokalizacja do wyszukania (opcjonalne)
 * @returns {Promise<Array>} Tablica parkingów
 */
async function loadParkings(location = null) {
    if (USE_API && API_BASE_URL) {
        try {
            isLoading = true;
            showLoadingState();
            
            // TODO:  endpoint do API
            let url = `${API_BASE_URL}/parkings`;
            if (location) {
                url += `?location=${encodeURIComponent(location)}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Dodaj autoryzację 
                    // 'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            isLoading = false;
            
            return data;
            
        } catch (error) {
            console.error('Error loading parkings from API:', error);
            isLoading = false;
            showErrorState('Failed to load parkings. Using sample data.');
            

            return SAMPLE_PARKING_DATA;
        }
    } else {

        return SAMPLE_PARKING_DATA;
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
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const parkingContainer = document.getElementById('parkingContainer');

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
                        <span class="price">$${parking.pricePerHour.toFixed(2)}/hour</span>
                    </div>
                </div>
                <button class="details-btn">Details</button>
            </div>
        `).join('');

        document.querySelectorAll('.parking-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.classList.contains('map-icon') || e.target.classList.contains('details-btn')) {
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

    modalName.textContent = parking.name;
    modalAddress.textContent = parking.address;
    modalTotalSpots.textContent = parking.totalSpots || 150;
    modalAvailableSpots.textContent = `${parking.availableSpots} spots`;
    modalRate.textContent = `$${parking.pricePerHour.toFixed(2)}/hour`;

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
 * Ładuje dane wykresu z API lub używa przykładowych danych
 */
async function loadChartData(parkingId) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/parkings/${parkingId}/occupancy`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // TODO: Dostosuj mapowanie danych jeśli struktura API jest inna
            return data;
        } catch (error) {
            console.error('Error loading chart data from API:', error);
            // Fallback do przykładowych danych
            return getSampleChartData();
        }
    } else {
        return getSampleChartData();
    }
}

/**
 * Zwraca przykładowe dane wykresu
 */
function getSampleChartData() {
    return {
        normal: [25, 40, 55, 70, 75, 70, 60, 50, 35],
        peak: [45, 65, 80, 90, 95, 90, 80, 70, 50],
        hours: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM']
    };
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

/**
 * Rysuje wykres na canvas
 */
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

