// State
let menuItems = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the menu
    loadMenuItems();

    // Set up event listeners
    setupEventListeners();

    // Update time display
    updateTime();
    setInterval(updateTime, 60000);

    // Load profile info
    loadProfile();

    // Initialize cart
    updateCartCount();
    renderCartItems();

    // Profile edit modal
    const profileEditModal = new bootstrap.Modal(document.getElementById('profileEditModal'));
    
    document.getElementById('profileEditBtn').addEventListener('click', function(e) {
        e.preventDefault();
        profileEditModal.show();
    });

    // Profile photo preview
    document.getElementById('profilePhotoInput').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profilePreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

document.getElementById('profileEditForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newName = document.getElementById('profileNameInput').value.trim();
    const fileInput = document.getElementById('profilePhotoInput');
    const profileEditModal = bootstrap.Modal.getInstance(document.getElementById('profileEditModal'));

    try {
        // Update profile name
        const updateResponse = await fetch('http://localhost:5000/api/user/profile', {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName: newName })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update profile');
        }

        // If profile photo changed, upload it
        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('profilePhoto', fileInput.files[0]);

            const photoResponse = await fetch('http://localhost:5000/api/user/profile/photo', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!photoResponse.ok) {
                throw new Error('Failed to upload profile photo');
            }

            const photoData = await photoResponse.json();
            document.getElementById('profileImage').src = photoData.profilePhoto.startsWith('http') ? photoData.profilePhoto : 'http://localhost:5000' + photoData.profilePhoto;
            document.getElementById('profilePreview').src = document.getElementById('profileImage').src;
        }

        // Update UI with new name
        document.getElementById('profileName').textContent = newName;
        profileEditModal.hide();
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
});

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('profileName');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('cart');
        window.location.href = '../auth/login.html';
    });
});

// Load menu items from backend
function loadMenuItems() {
    // Show loading state
    document.getElementById('menu-items-container').innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-gold" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading menu items...</p>
        </div>
    `;

    // Simulate API call (replace with actual fetch)
    setTimeout(() => {
        fetch('http://localhost:5000/api/dishes')
            .then(response => response.json())
            .then(data => {
                menuItems = data;
                displayMenuItems(menuItems);
            })
            .catch(error => {
                console.error('Error loading menu items:', error);
                document.getElementById('menu-items-container').innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <p class="text-danger">Failed to load menu. Please try again later.</p>
                        <button class="btn btn-gold" onclick="loadMenuItems()">Retry</button>
                    </div>
                `;
            });
    }, 1000);
}

// Display menu items
function displayMenuItems(items) {
    const container = document.getElementById('menu-items-container');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                <p class="text-muted">No menu items match your filters</p>
                <button class="btn btn-outline-gold" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const badges = [];
        if (item.vegetarian) badges.push('<span class="badge bg-success me-1">Veg</span>');
        if (item.vegan) badges.push('<span class="badge bg-primary me-1">Vegan</span>');
        if (item.glutenFree) badges.push('<span class="badge bg-info">GF</span>');

const premiumBadge = item.isPremium ? '<div class="badge-premium">Chef\'s Pick</div>' : '';

container.innerHTML += `
    <div class="col" data-category="${item.category}" 
         data-vegetarian="${item.vegetarian}" 
         data-vegan="${item.vegan}" 
         data-glutenfree="${item.glutenFree}"
         data-popular="${item.isPopular}"
         data-seasonal="${item.isSeasonal}">
        <div class="card menu-item h-100 border-0 shadow-sm">
            ${premiumBadge}
            <img src="${item.imageUrl.startsWith('http') ? item.imageUrl : 'http://localhost:5000/' + item.imageUrl}" class="card-img-top" alt="${item.name}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${item.name}</h5>
                    <span class="text-gold fw-bold">₹${item.price.toFixed(2)}</span>
                </div>
                <p class="card-text text-muted small">${item.description}</p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div>${badges.join('')}</div>
                    <button class="btn btn-sm btn-gold rounded-pill px-3 add-to-cart" data-id="${item._id}">
                        <i class="fas fa-plus me-1"></i> Add
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category filtering
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            filterMenuItems(category);

            // Update active state
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Dietary filtering
    document.querySelectorAll('.dietary-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Quick filters
    document.querySelectorAll('.quick-filter').forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            applyQuickFilter(filter);

            // Update active state
            document.querySelectorAll('.quick-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Search functionality
    document.getElementById('search-button').addEventListener('click', performSearch);
    document.getElementById('menu-search').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Add to cart buttons
    document.getElementById('menu-items-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
            const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
            const itemId = button.dataset.id;
            addToCart(itemId);
        }
    });

    // Cart offcanvas events
    document.getElementById('cart-items-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn') || e.target.closest('.quantity-btn')) {
            const button = e.target.classList.contains('quantity-btn') ? e.target : e.target.closest('.quantity-btn');
            const itemId = button.dataset.id;
            const action = button.dataset.action;
            updateCartItemQuantity(itemId, action);
        } else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const button = e.target.classList.contains('remove-item') ? e.target : e.target.closest('.remove-item');
            const itemId = button.dataset.id;
            removeCartItem(itemId);
        }
    });

    // Checkout button
    document.getElementById('checkout-button').addEventListener('click', proceedToCheckout);
}

// Filter menu items by category
function filterMenuItems(category) {
    const activeCategory = category || 'all';
    const vegetarianChecked = document.getElementById('vegetarianFilter')?.checked || false;
    const veganChecked = document.getElementById('veganFilter')?.checked || false;
    const glutenFreeChecked = document.getElementById('glutenFreeFilter')?.checked || false;

    const filteredItems = menuItems.filter(item => {
        const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
        const vegetarianMatch = !vegetarianChecked || item.vegetarian;
        const veganMatch = !veganChecked || item.vegan;
        const glutenFreeMatch = !glutenFreeChecked || item.glutenFree;

        return categoryMatch && vegetarianMatch && veganMatch && glutenFreeMatch;
    });

    displayMenuItems(filteredItems);
}

// Apply quick filter
function applyQuickFilter(filter) {
    let filteredItems = [...menuItems];

    switch (filter) {
        case 'all':
            // No additional filtering
            break;
        case 'popular':
            filteredItems = filteredItems.filter(item => item.isPopular);
            break;
        case 'chefs-picks':
            filteredItems = filteredItems.filter(item => item.isPremium);
            break;
        case 'seasonal':
            filteredItems = filteredItems.filter(item => item.isSeasonal);
            break;
        default:
            break;
    }

    // Apply category and dietary filters
    const activeCategoryButton = document.querySelector('.category-filter.active');
    const activeCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';

    const vegetarianChecked = document.getElementById('vegetarianFilter')?.checked || false;
    const veganChecked = document.getElementById('veganFilter')?.checked || false;
    const glutenFreeChecked = document.getElementById('glutenFreeFilter')?.checked || false;

    filteredItems = filteredItems.filter(item => {
        const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
        const vegetarianMatch = !vegetarianChecked || item.vegetarian;
        const veganMatch = !veganChecked || item.vegan;
        const glutenFreeMatch = !glutenFreeChecked || item.glutenFree;

        return categoryMatch && vegetarianMatch && veganMatch && glutenFreeMatch;
    });

    displayMenuItems(filteredItems);
}

// Apply all filters
function applyFilters() {
    const activeCategoryButton = document.querySelector('.category-filter.active');
    const activeCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'all';
    filterMenuItems(activeCategory);
}

// Perform search
function performSearch() {
    const searchTerm = document.getElementById('menu-search').value.trim().toLowerCase();
    if (!searchTerm) {
        applyFilters(); // Reset to current filters
        return;
    }

    const filteredItems = menuItems.filter(item => {
        return item.name.toLowerCase().includes(searchTerm) || 
               (item.description && item.description.toLowerCase().includes(searchTerm));
    });

    displayMenuItems(filteredItems);
}

// Reset all filters
function resetFilters() {
    // Reset category
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') btn.classList.add('active');
    });

    // Reset dietary filters
    document.getElementById('vegetarianFilter').checked = false;
    document.getElementById('veganFilter').checked = false;
    document.getElementById('glutenFreeFilter').checked = false;

    // Reset quick filters
    document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') btn.classList.add('active');
    });

    // Reset search
    document.getElementById('menu-search').value = '';

    // Show all items
    displayMenuItems(menuItems);
}

// Add item to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id == itemId);
    if (!item) return;

    const existingItem = cart.find(i => i.id == itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            quantity: 1 
        });
    }

    updateCart();
    showAddToCartConfirmation(item.name);
}

// Update cart in storage and UI
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

// Update cart count
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = total;
    cartCount.style.display = total > 0 ? 'flex' : 'none';
}

// Render cart items
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                <p class="text-muted">Your cart is empty</p>
            </div>
        `;
        updateCartSummary(0, 0, 0);
        return;
    }

    cart.forEach(item => {
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.imageUrl.startsWith('http') ? item.imageUrl : 'http://localhost:5000/' + item.imageUrl}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="quantity-control mt-2">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                        <button class="remove-item ms-3" data-id="${item.id}" title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    updateCartSummary(subtotal, tax, total);
}

// Update cart summary
function updateCartSummary(subtotal, tax, total) {
    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

// Update cart item quantity
function updateCartItemQuantity(itemId, action) {
    const item = cart.find(i => i.id == itemId);
    if (!item) return;

    if (action === 'increase') {
        item.quantity += 1;
    } else if (action === 'decrease') {
        item.quantity = Math.max(1, item.quantity - 1);
    }

    updateCart();
}

// Remove item from cart
function removeCartItem(itemId) {
    cart = cart.filter(i => i.id != itemId);
    updateCart();
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Save cart for checkout page
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'payment.html';
}

// Show add to cart confirmation
function showAddToCartConfirmation(itemName) {
    showToast(`${itemName} added to cart!`, 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toastId = `toast-${Date.now()}`;
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast show align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'dark'} border-0`;
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
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.hide();
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }, 3000);
}

// Create toast container if not exists
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Load profile from backend API
async function loadProfile() {
    try {
        const response = await fetch('http://localhost:5000/api/user/profile', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        const user = await response.json();
        const profileNameElem = document.getElementById('profileName');
        const profileNameInput = document.getElementById('profileNameInput');
        const profileImage = document.getElementById('profileImage');
        const profilePreview = document.getElementById('profilePreview');

        if (user.name) {
            profileNameElem.textContent = user.name;
            profileNameInput.value = user.name;
        }
        if (user.profilePhoto) {
            const photoUrl = user.profilePhoto.startsWith('http') ? user.profilePhoto : 'http://localhost:5000' + user.profilePhoto;
            profileImage.src = photoUrl;
            profilePreview.src = photoUrl;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

// Update time display
function updateTime() {
    const now = new Date();
    const timeElem = document.getElementById('current-time');
    const dateElem = document.getElementById('current-date');
    
    if (timeElem) {
        timeElem.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (dateElem) {
        dateElem.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
}