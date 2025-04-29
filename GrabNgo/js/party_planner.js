// --- State ---
let allMenuItems = []; // Store all fetched items
let displayedMenuItems = []; // Store items currently displayed (after search)
let partyOrder = []; // Array to hold { itemId, quantity, name, price }

// --- DOM Elements ---
const menuItemsContainer = document.getElementById('party-menu-items-container');
const orderSummaryContainer = document.getElementById('party-order-summary');
const totalItemsSpan = document.getElementById('party-total-items');
const submitPlanBtn = document.getElementById('submit-party-plan-btn');
const loadingIndicator = document.getElementById('party-menu-loading');
const searchInput = document.getElementById('party-menu-search');
const guestCountInput = document.getElementById('guestCount');
const eventDateInput = document.getElementById('eventDate');
const totalAmountSpan = document.getElementById('party-total-amount');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Party Planner DOM Loaded');
    fetchMenuItems();
    setupEventListeners();
    // updatePartyOrderSummary(); // Initial update for empty state
});

// --- Fetch Menu Items ---
async function fetchMenuItems() {
    showLoading(true);
    try {
        const response = await fetch('http://localhost:5000/api/dishes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allMenuItems = await response.json();
        displayedMenuItems = [...allMenuItems]; // Initially display all
        console.log('Menu items fetched:', allMenuItems);
        displayPartyMenuItems(displayedMenuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        if (menuItemsContainer) {
             menuItemsContainer.innerHTML = `<div class="col-12 text-center text-danger">Failed to load menu items. Please try refreshing.</div>`;
        }
    } finally {
        showLoading(false);
    }
}

// --- Display Menu Items ---
function displayPartyMenuItems(items) {
    if (!menuItemsContainer) return;
    menuItemsContainer.innerHTML = ''; // Clear existing items

    if (!items || items.length === 0) {
        menuItemsContainer.innerHTML = `<div class="col-12 text-center text-muted">No menu items found matching your search.</div>`;
        return;
    }

    items.forEach(item => {
        if (!item || !item._id) return; // Skip invalid items

        const col = document.createElement('div');
        col.className = 'col';
        const currentQuantity = getItemQuantityFromOrder(item._id);

        col.innerHTML = `
            <div class="card h-100 shadow-sm party-menu-item-card">
                <img src="${item.image || '../images/default-profile.png'}" class="card-img-top menu-item-img" alt="${item.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${item.name || 'Unnamed Item'}</h5>
                    <p class="card-text small text-muted mb-2 flex-grow-1">${item.description || ''}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="item-price fw-bold text-gold">₹${(item.price || 0).toFixed(2)}</span>
                        <!-- Rating display can be added here if needed -->
                    </div>
                    <div class="input-group input-group-sm quantity-input-group mt-auto" data-item-id="${item._id}">
                        <button class="btn btn-outline-secondary quantity-decrease" type="button">-</button>
                        <input type="number" class="form-control quantity-input" value="${currentQuantity}" min="0" aria-label="Quantity" 
                               data-item-id="${item._id}" data-item-name="${item.name}" data-item-price="${item.price}">
                        <button class="btn btn-outline-secondary quantity-increase" type="button">+</button>
                    </div>
                </div>
            </div>
        `;
        menuItemsContainer.appendChild(col);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    // Quantity buttons and input changes (using event delegation)
    if (menuItemsContainer) {
        menuItemsContainer.addEventListener('click', handleQuantityButtonClick);
        menuItemsContainer.addEventListener('change', handleQuantityInputChange);
    }

    // Submit button
    if (submitPlanBtn) {
        submitPlanBtn.addEventListener('click', submitPartyPlan);
    }
    
    // Search input
    if(searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

function handleQuantityButtonClick(event) {
    const target = event.target;
    const inputGroup = target.closest('.quantity-input-group');
    if (!inputGroup) return;

    const quantityInput = inputGroup.querySelector('.quantity-input');
    if (!quantityInput) return;

    let currentVal = parseInt(quantityInput.value) || 0;

    if (target.classList.contains('quantity-increase')) {
        currentVal++;
    } else if (target.classList.contains('quantity-decrease')) {
        currentVal = Math.max(0, currentVal - 1); // Ensure quantity doesn't go below 0
    }
    
    quantityInput.value = currentVal;
    // Trigger change event manually to update the order
    quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
}

function handleQuantityInputChange(event) {
    if (event.target.classList.contains('quantity-input')) {
        const input = event.target;
        const itemId = input.dataset.itemId;
        const itemName = input.dataset.itemName;
        const itemPrice = parseFloat(input.dataset.itemPrice);
        let quantity = parseInt(input.value) || 0;
        
        if (quantity < 0) { // Prevent negative numbers manually if min="0" fails
            quantity = 0;
            input.value = 0;
        }

        console.log(`Quantity change: Item ID ${itemId}, New Quantity ${quantity}`);
        updatePartyOrderItem(itemId, quantity, itemName, itemPrice);
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayedMenuItems = [...allMenuItems];
    } else {
        displayedMenuItems = allMenuItems.filter(item => 
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }
    displayPartyMenuItems(displayedMenuItems);
}

// --- Party Order Logic ---
function updatePartyOrderItem(itemId, quantity, name, price) {
    const existingItemIndex = partyOrder.findIndex(item => item.itemId === itemId);

    if (quantity > 0) {
        if (existingItemIndex > -1) {
            // Update existing item quantity
            partyOrder[existingItemIndex].quantity = quantity;
        } else {
            // Add new item to order
            partyOrder.push({ itemId, quantity, name, price });
        }
    } else {
        // Remove item if quantity is 0 or less
        if (existingItemIndex > -1) {
            partyOrder.splice(existingItemIndex, 1);
        }
    }
    
    console.log('Party Order Updated:', partyOrder);
    updatePartyOrderSummary();
}

function updatePartyOrderSummary() {
    // Ensure DOM elements are available
    if (!orderSummaryContainer || !totalItemsSpan || !totalAmountSpan) { 
        console.error("Summary DOM elements not found!");
        return;
    }

    orderSummaryContainer.innerHTML = ''; // Clear summary
    let totalItems = 0;
    let totalAmount = 0;

    if (partyOrder.length === 0) {
        orderSummaryContainer.innerHTML = `<p class="text-muted text-center py-4">Select items from the menu to add them here.</p>`;
        totalItemsSpan.textContent = '0';
        totalAmountSpan.textContent = '₹0.00'; // Reset amount
        return;
    }

    partyOrder.forEach(item => {
        totalItems += item.quantity;
        // Ensure price and quantity are numbers before calculation
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        totalAmount += (itemPrice * itemQuantity);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <span class="summary-item-name">${item.name}</span>
            <span class="summary-item-qty">x ${itemQuantity}</span> 
            <!-- Optional: Add item subtotal -->
            <!-- <span class="ms-2 text-muted small">₹${(itemPrice * itemQuantity).toFixed(2)}</span> -->
        `;
        orderSummaryContainer.appendChild(itemElement);
    });

    totalItemsSpan.textContent = totalItems;
    totalAmountSpan.textContent = `₹${totalAmount.toFixed(2)}`; // Update amount display
}

function getItemQuantityFromOrder(itemId) {
    const item = partyOrder.find(item => item.itemId === itemId);
    return item ? item.quantity : 0;
}

// --- Submit Logic ---
async function submitPartyPlan() {
    if (partyOrder.length === 0) {
        showToast('Please add items to your party plan before submitting.', 'warning');
        return;
    }

    const planData = {
        guestCount: guestCountInput ? guestCountInput.value : null,
        eventDate: eventDateInput ? eventDateInput.value : null,
        items: partyOrder // Send the array of { itemId, quantity, name, price }
    };

    console.log('Submitting Party Plan:', planData);
    showToast('Submitting your plan...', 'info');
    submitPlanBtn.disabled = true;

    // ** IMPORTANT: Replace with your ACTUAL backend endpoint **
    const backendUrl = 'http://localhost:5000/api/party/submit'; 

    try {
        const token = localStorage.getItem('authToken'); // Include auth if needed by backend
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(planData)
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
             throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // Assuming backend responds with success message
        const result = await response.json(); 
        showToast(result.message || 'Party plan submitted successfully! We will contact you shortly.', 'success');
        
        // Optionally clear the form/order after successful submission
        // partyOrder = [];
        // updatePartyOrderSummary();
        // if(guestCountInput) guestCountInput.value = '';
        // if(eventDateInput) eventDateInput.value = '';
        // displayPartyMenuItems(displayedMenuItems); // Refresh quantities to 0

    } catch (error) {
        console.error('Error submitting party plan:', error);
        showToast(`Error: ${error.message || 'Could not submit party plan. Please try again.'}`, 'error');
    } finally {
        submitPlanBtn.disabled = false;
    }
}

// --- Utility Functions ---
function showLoading(isLoading) {
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
}

// Simple Toast Function (Adapt or reuse from menu.js/auth.js if available globally)
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found!');
        alert(message); // Fallback
        return;
    }
    
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-info';
    
    toast.id = toastId;
    toast.className = `toast show align-items-center text-white ${bgColor} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
} 