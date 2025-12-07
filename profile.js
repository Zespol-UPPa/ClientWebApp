const API_BASE_URL = null;
const USE_API = false;

let userData = {
    firstName: '',
    lastName: '',
    email: ''
};

let vehicles = [];
let isEditingPersonalInfo = false;
let isChangingPassword = false;

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

    setupNavigation();
    setupPersonalInfo();
    setupPasswordChange();
    setupVehicles();
    setupAccountActions();
    setupLogout();
    loadUserData();
    loadVehicles();
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
    emailInput.readOnly = false;
    
    firstNameInput.classList.add('editable');
    lastNameInput.classList.add('editable');
    emailInput.classList.add('editable');
    
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

    if (!firstName || !lastName || !email) {
        alert('Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        await updatePersonalInfo({ firstName, lastName, email });
        userData = { firstName, lastName, email };
        disablePersonalInfoEditing();
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
        console.log('Privacy Policy clicked');

    });

    document.getElementById('termsLink').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Terms of service clicked');

    });

    document.getElementById('helpSupportLink').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Help & Support clicked');

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
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'home.html';
    }
}


async function loadUserData() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            userData = {
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || ''
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            userData = { firstName: '', lastName: '', email: '' };
        }
    } else {

        userData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@email.com'
        };
    }

    document.getElementById('firstNameInput').value = userData.firstName;
    document.getElementById('lastNameInput').value = userData.lastName;
    document.getElementById('emailInput').value = userData.email;
}

async function updatePersonalInfo(data) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating personal info:', error);
            throw error;
        }
    } else {

        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }
}

async function changePassword(currentPassword, newPassword) {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Current password is incorrect');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    } else {

        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
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

async function deleteAccount() {
    if (USE_API && API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'home.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account. Please try again.');
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'home.html';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

