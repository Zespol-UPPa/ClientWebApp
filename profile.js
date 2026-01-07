// API module is loaded from api.js

let userData = {
    firstName: '',
    lastName: '',
    email: ''
};

let vehicles = [];
let isEditingPersonalInfo = false;
let isChangingPassword = false;

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

    setupNavigation();
    setupPasswordChange();
    setupAccountActions();
    setupLogout();
    
    // Load user data first, then setup personal info section
    // This ensures input fields are populated with actual data, not placeholder values
    Promise.all([
        loadUserData(),
        loadVehicles()
    ]).then(() => {
        // After data is loaded, setup personal info and vehicles
        setupPersonalInfo();
        setupVehicles();
        renderVehicles(); // Render vehicles after loading
    }).catch((error) => {
        // If loading fails, still setup personal info (will show error message)
        setupPersonalInfo();
        setupVehicles();
        renderVehicles(); // Render vehicles even if loading failed (will show empty list)
    });
});


function setupNavigation() {
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
            break;
    }
}


function setupPersonalInfo() {
    const editBtn = document.getElementById('editPersonalInfoBtn');
    const cancelBtn = document.getElementById('cancelPersonalInfoBtn');
    const saveBtn = document.getElementById('savePersonalInfoBtn');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');

    editBtn.addEventListener('click', function() {
        enablePersonalInfoEditing();
    });

    cancelBtn.addEventListener('click', function() {
        disablePersonalInfoEditing();
        firstNameInput.value = userData.firstName;
        lastNameInput.value = userData.lastName;
        emailInput.value = userData.email;
    });

    saveBtn.addEventListener('click', async function() {
        await savePersonalInfo();
    });
}

function enablePersonalInfoEditing() {
    isEditingPersonalInfo = true;
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');
    
    firstNameInput.readOnly = false;
    lastNameInput.readOnly = false;
    // Email is read-only - cannot be changed through customer-service
    emailInput.readOnly = true;
    
    firstNameInput.classList.add('editable');
    lastNameInput.classList.add('editable');
    // Email stays read-only
    emailInput.classList.remove('editable');
    
    document.getElementById('editPersonalInfoBtn').style.display = 'none';
    document.getElementById('personalInfoSaveCancel').style.display = 'flex';
}

function disablePersonalInfoEditing() {
    isEditingPersonalInfo = false;
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');
    
    firstNameInput.readOnly = true;
    lastNameInput.readOnly = true;
    emailInput.readOnly = true;
    
    firstNameInput.classList.remove('editable');
    lastNameInput.classList.remove('editable');
    emailInput.classList.remove('editable');
    
    document.getElementById('editPersonalInfoBtn').style.display = 'block';
    document.getElementById('personalInfoSaveCancel').style.display = 'none';
}

async function savePersonalInfo() {
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();

    if (!firstName || !lastName) {
        alert('Please fill in first name and last name');
        return;
    }

    // Email is read-only and cannot be changed through this interface
    // It's managed by accounts-service and requires separate email change flow
    if (email && !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        // Only update firstName and lastName - email cannot be changed here
        await updatePersonalInfo({ firstName, lastName });
        userData = { firstName, lastName, email: userData.email }; // Keep original email
        disablePersonalInfoEditing();
        alert('Personal information updated successfully');
    } catch (error) {
        alert('Error updating personal information. Please try again.');
    }
}


function setupPasswordChange() {
    const changeBtn = document.getElementById('changePasswordBtn');
    const cancelBtn = document.getElementById('cancelPasswordBtn');
    const updateBtn = document.getElementById('updatePasswordBtn');

    changeBtn.addEventListener('click', function() {
        showPasswordForm();
    });

    cancelBtn.addEventListener('click', function() {
        hidePasswordForm();
        clearPasswordForm();
    });

    updateBtn.addEventListener('click', async function() {
        await updatePassword();
    });
}

function showPasswordForm() {
    isChangingPassword = true;
    document.getElementById('passwordSummary').style.display = 'none';
    document.getElementById('changePasswordBtn').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'block';
}

function hidePasswordForm() {
    isChangingPassword = false;
    document.getElementById('passwordSummary').style.display = 'block';
    document.getElementById('changePasswordBtn').style.display = 'block';
    document.getElementById('passwordForm').style.display = 'none';
}

function clearPasswordForm() {
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    document.getElementById('passwordErrorMessage').style.display = 'none';
}

async function updatePassword() {
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    const errorMessage = document.getElementById('passwordErrorMessage');

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.style.display = 'block';
        return;
    }

    if (newPassword.length < 8) {
        errorMessage.textContent = 'Password must be at least 8 characters long';
        errorMessage.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorMessage.textContent = 'New passwords do not match';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        await changePassword(currentPassword, newPassword);
        hidePasswordForm();
        clearPasswordForm();
        alert('Password updated successfully');
    } catch (error) {
        errorMessage.textContent = error.message || 'Error updating password. Please try again.';
        errorMessage.style.display = 'block';
    }
}


function setupVehicles() {
    const addVehicleBtn = document.getElementById('addVehicleBtn');
    const addVehicleModal = document.getElementById('addVehicleModal');
    const closeVehicleModal = document.getElementById('closeVehicleModal');
    const addVehicleForm = document.getElementById('addVehicleForm');

    addVehicleBtn.addEventListener('click', function() {
        openAddVehicleModal();
    });

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


function setupAccountActions() {
    document.getElementById('privacyPolicyLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'privacy-policy.html';
    });

    document.getElementById('termsLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'terms-of-service.html';
    });

    document.getElementById('helpSupportLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'help-support.html';
    });

    document.getElementById('deleteAccountLink').addEventListener('click', function(e) {
        e.preventDefault();
        handleDeleteAccount();
    });
}

function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete your account and all data. Are you absolutely sure?')) {
            deleteAccount();
        }
    }
}


function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        handleLogout();
    });
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        api.clearToken();
        window.location.href = 'home.html';
    }
}


async function loadUserData() {
    try {
        const data = await api.get('/customer/profile');
        userData = {
            firstName: data.firstName || data.first_name || '',
            lastName: data.lastName || data.last_name || '',
            email: data.email || ''
        };
        
        // Only set input values if data was successfully loaded
        document.getElementById('firstNameInput').value = userData.firstName;
        document.getElementById('lastNameInput').value = userData.lastName;
        document.getElementById('emailInput').value = userData.email;
    } catch (error) {
        // Check if it's an authorization error
        if (error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            api.redirectToLogin();
            return;
        }
        console.error('Error loading user data:', error);
        // Clear placeholder values and show error message
        const firstNameInput = document.getElementById('firstNameInput');
        const lastNameInput = document.getElementById('lastNameInput');
        const emailInput = document.getElementById('emailInput');
        
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        if (emailInput) emailInput.value = '';
        
        // Show error message
        const errorMessage = document.getElementById('errorMessage') || document.createElement('div');
        if (!errorMessage.id) {
            errorMessage.id = 'errorMessage';
            errorMessage.style.cssText = 'color: red; padding: 10px; margin: 10px 0; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;';
            const personalInfoSection = document.querySelector('.personal-info-section');
            if (personalInfoSection) {
                const fieldsContainer = document.getElementById('personalInfoFields');
                if (fieldsContainer && fieldsContainer.parentNode) {
                    fieldsContainer.parentNode.insertBefore(errorMessage, fieldsContainer);
                } else {
                    personalInfoSection.insertBefore(errorMessage, personalInfoSection.firstChild);
                }
            }
        }
        errorMessage.textContent = 'Failed to load user data. Please refresh the page or try again later.';
    }
}

async function updatePersonalInfo(data) {
    try {
        // Customer service expects query params for PUT
        // Note: Email cannot be changed through customer-service (it's managed by accounts-service)
        const params = new URLSearchParams();
        params.append('firstName', data.firstName);
        params.append('lastName', data.lastName);
        
        await api.put(`/customer/profile?${params.toString()}`, null);
        return { success: true };
    } catch (error) {
        console.error('Error updating personal info:', error);
        throw error;
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        // Note: This endpoint needs to be implemented in customer-service
        await api.put('/customer/password', {
            currentPassword,
            newPassword
        });
        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.message.includes('401') || error.message.includes('incorrect')) {
            throw new Error('Current password is incorrect');
        }
        throw error;
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
            api.redirectToLogin();
            return;
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
        
        // Backend returns { id: ... } or { id: ..., ... }
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

async function deleteAccount() {
    try {
        // Note: This endpoint needs to be implemented in customer-service or accounts-service
        await api.delete('/customer/account');
        api.clearToken();
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account. Please try again.');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


