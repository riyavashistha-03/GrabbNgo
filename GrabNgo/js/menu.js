// State
let menuItems = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let userData = null;
let ratingModalInstance = null; // Ensure it's declared globally
let currentRatingItemId = null;
let currentSelectedRating = 0;
let dishDetailModalInstance = null; // Add this

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
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

    // Profile edit modal setup (ensure this doesn't interfere)
    try {
        const profileModalElement = document.getElementById('profileEditModal');
        if (profileModalElement) {
            const profileEditModal = new bootstrap.Modal(profileModalElement);
            
            const profileEditBtn = document.getElementById('profileEditBtn');
            if(profileEditBtn) {
                profileEditBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    profileEditModal.show();
                });
            } else { console.warn('Profile edit button not found'); }
            
            const photoInput = document.getElementById('profilePhotoInput');
            if(photoInput) {
                photoInput.addEventListener('change', function() {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                           const preview = document.getElementById('profilePreview');
                           if(preview) preview.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            } else { console.warn('Profile photo input not found'); }

        } else {
             console.warn('Profile edit modal element not found');
        }
    } catch (error) {
        console.error("Error setting up profile modal: ", error);
    }
    
     // Initialize Rating Modal Instance
    try {
        const ratingModalElement = document.getElementById('ratingModal');
        if (ratingModalElement) {
            console.log('Rating modal element found. Initializing Bootstrap modal...');
            ratingModalInstance = new bootstrap.Modal(ratingModalElement);
            console.log('ratingModalInstance initialized:', ratingModalInstance ? 'Success' : 'Failed');

            // Rating modal star interaction
            const starsContainer = document.getElementById('modalStarRating');
            if (starsContainer) {
                 starsContainer.addEventListener('mouseover', handleStarHover);
                 starsContainer.addEventListener('mouseout', handleStarMouseOut);
                 starsContainer.addEventListener('click', handleStarClick);
                 console.log('Rating star listeners attached.');
            } else { console.warn('Rating modal stars container not found'); }

            // Rating modal submit button
            const submitRatingBtn = document.getElementById('submitRatingBtn');
            if (submitRatingBtn) {
                submitRatingBtn.addEventListener('click', submitRating);
                console.log('Rating submit listener attached.');
            } else { console.warn('Rating submit button not found'); }
            
        } else {
            console.error("Rating modal element (#ratingModal) NOT FOUND in DOM!");
            ratingModalInstance = null; // Explicitly set to null if not found
        }
    } catch (error) {
         console.error("Error initializing rating modal: ", error);
         ratingModalInstance = null; // Ensure it's null on error
    }

    // Profile edit form submission (keep existing logic)
    const profileEditForm = document.getElementById('profileEditForm');
    if(profileEditForm) {
        profileEditForm.addEventListener('submit', async function(e) {
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
                   const profileImgElem = document.getElementById('userProfileImg'); 
                   if (profileImgElem) {
                       profileImgElem.src = photoData.profilePhoto.startsWith('http') ? photoData.profilePhoto : 'http://localhost:5000/' + photoData.profilePhoto;
                   }
                    const previewImgElem = document.getElementById('profilePreview');
                   if (previewImgElem) {
                       previewImgElem.src = document.getElementById('userProfileImg').src; 
                   }
               }

               // Update UI with new name
               const profileNameElem = document.getElementById('userName');
               if (profileNameElem) {
                   profileNameElem.textContent = newName;
               }
               profileEditModal.hide();
               showToast('Profile updated successfully!', 'success');
           } catch (error) {
               console.error('Error updating profile:', error);
               showToast('Failed to update profile', 'error');
           }
        });
    } else { console.warn('Profile edit form not found'); }

    // Logout functionality (keep existing logic)
     const logoutBtn = document.getElementById('logoutBtn');
     if(logoutBtn) {
         logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('profileName');
            localStorage.removeItem('profileImage');
            localStorage.removeItem('cart');
            window.location.href = '../auth/login.html';
         });
     } else { console.warn('Logout button not found'); }
     
     console.log('DOM Content Loaded - Initialization complete.');

    // Initialize Dish Detail Modal Instance
    try {
        const modalElement = document.getElementById('dishDetailModal');
        if (modalElement) {
            dishDetailModalInstance = new bootstrap.Modal(modalElement);
            console.log('Dish Detail Modal Instance Initialized.');
            
            // Add event listener for the cart button INSIDE the modal
            const modalCartBtn = modalElement.querySelector('.add-to-cart-from-modal');
            if (modalCartBtn) {
                 modalCartBtn.addEventListener('click', handleAddToCartFromModal);
            } else { console.warn('Add to Cart button not found inside dish detail modal.'); }

        } else {
            console.error("Dish Detail Modal element (#dishDetailModal) NOT FOUND in DOM!");
        }
    } catch(error) {
        console.error("Error initializing Dish Detail modal: ", error);
    }
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
    container.innerHTML = ''; // Clear previous items

    if (!items || items.length === 0) {
        console.log("No items to display or items array is empty/null.");
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
        // Log each item being processed
        console.log('Displaying item:', item); 
        
        if (!item || !item._id) {
             console.warn('Skipping item due to missing data (e.g., _id):', item);
             return; // Skip items with missing essential data
        }

        const badges = [];
        if (item.vegetarian) badges.push('<span class="badge bg-success me-1">Veg</span>');
        if (item.vegan) badges.push('<span class="badge bg-primary me-1">Vegan</span>');
        if (item.glutenFree) badges.push('<span class="badge bg-info me-1">GF</span>'); // Added space

        const premiumBadge = item.isPremium ? '<div class="badge-premium">Chef\'s Pick</div>' : '';

        const col = document.createElement('div');
        // Use 'col' directly, sizing handled by parent row-cols-* classes
        col.className = 'col'; 

        // Corrected innerHTML structure
        col.innerHTML = `
          <div class="card h-100 menu-item-card shadow-sm" data-item-id="${item._id}">
            <img src="${item.image || '../images/default-profile.png'}" class="card-img-top menu-item-img" alt="${item.name}">
            ${premiumBadge}
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${item.name || 'Unnamed Item'}</h5>
              <p class="card-text small text-muted mb-2">${item.description || ''}</p>
              <div class="badges-container mb-2">
                  ${badges.join('')}
              </div>
              
              <!-- Rating Display -->
              <div class="item-rating mb-2" id="rating-display-${item._id}">
                ${ generateRatingStars(item.averageRating, item.ratingCount) }
              </div>
              
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <span class="item-price fw-bold text-gold">₹${(item.price || 0).toFixed(2)}</span>
                <div class="item-actions">
                  <button class="btn btn-sm btn-outline-secondary rate-item-btn me-2" data-id="${item._id}" title="Rate Item">
                    <i class="far fa-star"></i> Rate
                  </button>
                  <button class="btn btn-success btn-sm add-to-cart-btn" data-id="${item._id}" title="Add to Cart">
                     <i class="fas fa-cart-plus"></i> 
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        container.appendChild(col);
    });
}

// Helper function to generate rating stars HTML
function generateRatingStars(averageRating, ratingCount) {
    if (averageRating === undefined || averageRating === null || averageRating <= 0) {
        return '<span class="text-muted small">No ratings yet</span>';
    }
    const rating = parseFloat(averageRating).toFixed(1);
    const countText = ratingCount !== undefined ? `(${ratingCount})` : ''; 
    // Basic star display - could be enhanced with half-stars etc. later
    return `
        <span class="text-gold fw-bold">
            <i class="fas fa-star"></i> ${rating}
        </span>
        <span class="text-muted small ms-1">${countText}</span>
    `;
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

    // Add to cart & Rate buttons (using event delegation)
    const menuContainer = document.getElementById('menu-items-container');
    if (menuContainer) {
        menuContainer.addEventListener('click', function(e) {
            console.log('Click detected inside menu container'); 
            
            const addToCartButton = e.target.closest('.add-to-cart-btn');
            const rateButton = e.target.closest('.rate-item-btn');
            const cardElement = e.target.closest('.menu-item-card'); // Check for card click

            if (addToCartButton) {
                const itemId = addToCartButton.dataset.id;
                console.log('Add to Cart button clicked for itemId:', itemId);
                // Find the actual item from the menuItems array
                const itemToAdd = menuItems.find(item => item._id === itemId);
                if (itemToAdd) {
                    console.log('Found item to add:', itemToAdd);
                    addToCart(itemToAdd); // Pass the full item object
                } else {
                    console.error("Could not find item in menuItems array with ID:", itemId);
                    showToast("Error adding item to cart. Item data not found.", "error");
                }
            } else if (rateButton) {
                const itemId = rateButton.dataset.id;
                console.log('Rate button clicked for itemId:', itemId);
                openRatingModal(itemId); // Pass the item ID
            } else if (cardElement) { // If click was on card itself (and not buttons)
                 const itemId = cardElement.dataset.itemId;
                 console.log('Menu item card clicked for details, itemId:', itemId);
                 openDishDetailsModal(itemId); // Open details modal
            } else {
                 console.log('Click was not on Add to Cart, Rate button, or Card');
            }
        });
    } else {
        console.error('Menu items container not found for event listener setup!');
    }

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
function addToCart(item) {
    // Find using _id
    const existingItem = cart.find(i => i._id === item._id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
        // Push using _id
        cart.push({ 
            _id: item._id, // Store _id
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
    const container = document.getElementById('cart-items-container'); // Target ID
    if (!container) {
        console.error('Cart items container not found!');
        return; // Exit if container missing
    }
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                <p class="text-muted">Your cart is empty</p>
            </div>
        `;
        updateCartSummary(0, 0);
        return;
    }

    cart.forEach(item => {
        // Ensure imageUrl is handled correctly (relative/absolute)
        const imageUrl = item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:5000/${item.imageUrl.replace(/\\/g, '/')}`) : '../images/default-profile.png';
        container.innerHTML += `
            <div class="cart-item">
                <img src="${imageUrl}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="quantity-control mt-2">
                        <button class="quantity-btn" data-id="${item._id}" data-action="decrease">-</button> <!-- Use _id -->
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item._id}" data-action="increase">+</button> <!-- Use _id -->
                        <button class="remove-item ms-3" data-id="${item._id}" title="Remove item"> <!-- Use _id -->
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    // Calculate subtotal only
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Total is now just the subtotal

    updateCartSummary(subtotal, total); // Pass only subtotal and total
}

// Update cart summary
function updateCartSummary(subtotal, total) { // Removed tax parameter
    // Ensure these elements exist
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

// Update cart item quantity
function updateCartItemQuantity(itemId, action) { // itemId here is _id
    const item = cart.find(i => i._id === itemId); // Find using _id
    if (!item) return;

    if (action === 'increase') {
        item.quantity += 1;
    } else if (action === 'decrease') {
        item.quantity = Math.max(1, item.quantity - 1);
    }

    updateCart();
}

// Remove item from cart
function removeCartItem(itemId) { // itemId here is _id
    cart = cart.filter(i => i._id !== itemId); // Filter using _id
    updateCart();
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Get scheduled time
    const scheduleTimeInput = document.getElementById('scheduleTimeInput');
    const scheduledTime = scheduleTimeInput ? scheduleTimeInput.value : null;

    // Save cart and schedule time for checkout page
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    
    if (scheduledTime) {
        localStorage.setItem('scheduledTime', scheduledTime);
        console.log('Order scheduled for:', scheduledTime);
    } else {
        localStorage.removeItem('scheduledTime'); // Remove if not scheduled
        console.log('Ordering for ASAP (no schedule time selected).');
    }
    
    // Redirect to payment/checkout page
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
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found, cannot load profile.');
        showToast('Please log in to view profile.', 'error');
        userData = null; // Explicitly set userData to null
        updateProfileDisplay(); 
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/user/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (!response.ok) {
            console.error(`Error fetching profile: ${response.status} (${response.statusText})`); 
            throw new Error('Failed to fetch profile');
        }
        
        const user = await response.json();
        userData = user; // Update the global userData variable
        updateProfileDisplay(); // Update UI with fetched data

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
        userData = null; // Ensure userData is null on error
        updateProfileDisplay(); // Update UI to show default state on error
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

function updateProfileDisplay() {
    // Get elements regardless of userData status
    const profileInitialDiv = document.querySelector('.profile-initial'); 
    const userNameElement = document.getElementById('userName');
    const userProfileImgElement = document.getElementById('userProfileImg');
    const previewProfileImgElement = document.getElementById('profilePreview'); 

    // Add checks to ensure elements exist before modifying
    if (!userNameElement || !userProfileImgElement) {
        console.error('Profile display elements not found in DOM!');
        return; 
    }

    if (userData && userData.fullName) {
      // User data loaded successfully
      userNameElement.textContent = userData.fullName;
      if (userData.profilePhoto) {
        // Construct full URL for profile photo
        const photoUrl = userData.profilePhoto.startsWith('http') ? userData.profilePhoto : `http://localhost:5000/${userData.profilePhoto.replace(/\\/g, '/')}`;
        userProfileImgElement.src = photoUrl;
        userProfileImgElement.style.display = 'block';
        if (profileInitialDiv) profileInitialDiv.style.display = 'none';
      } else {
        // Show initial if no photo
        userProfileImgElement.style.display = 'none';
        if (profileInitialDiv) {
          const initial = userData.fullName.charAt(0).toUpperCase();
          profileInitialDiv.textContent = initial;
          profileInitialDiv.style.display = 'flex';
        }
      }
      // Update modal preview image
      if (previewProfileImgElement) {
         const previewUrl = userData.profilePhoto ? userProfileImgElement.src : '../images/default-profile.png';
         previewProfileImgElement.src = previewUrl;
      }
    } else {
      // Fetch failed or no user data - Show defaults
      userNameElement.textContent = 'User'; // Default name
      userProfileImgElement.style.display = 'none'; // Hide image
      if (profileInitialDiv) {
        profileInitialDiv.textContent = 'U'; // Default initial
        profileInitialDiv.style.display = 'flex';
      }
      // Set default modal preview image
       if (previewProfileImgElement) {
         previewProfileImgElement.src = '../images/default-profile.png';
      }
    }
  }

// --- Rating Functions --- 

function openRatingModal(itemId) {
    const item = menuItems.find(i => i._id === itemId);
    if (!item) {
        console.error("Item not found for rating:", itemId);
        showToast("Could not find item to rate.", "error");
        return;
    }

    currentRatingItemId = itemId;
    currentSelectedRating = 0; // Reset rating

    // Update modal content
    const ratingItemNameElem = document.getElementById('ratingItemName');
    const ratingItemIdInput = document.getElementById('ratingItemId');
    const selectedRatingValueInput = document.getElementById('selectedRatingValue');
    
    if(ratingItemNameElem) ratingItemNameElem.textContent = item.name;
    if(ratingItemIdInput) ratingItemIdInput.value = itemId;
    if(selectedRatingValueInput) selectedRatingValueInput.value = ''; // Clear stored value
    
    resetStars(); // Set stars to default empty state

    // Show modal
    if (ratingModalInstance) {
        ratingModalInstance.show();
    } else {
        console.error("Rating modal instance not initialized.");
        showToast("Error opening rating modal.", "error");
    }
}

function resetStars() {
    const stars = document.querySelectorAll('#modalStarRating i');
    if (stars.length > 0) {
        stars.forEach(star => {
            star.classList.remove('fas'); // Remove solid class
            star.classList.add('far');   // Add outline class
        });
    } else {
      // console.warn('No stars found in resetStars'); // Optional warning
    }
}

function highlightStars(ratingValue) {
    const stars = document.querySelectorAll('#modalStarRating i');
     if (stars.length > 0) {
        stars.forEach(star => {
            const starValue = parseInt(star.dataset.value);
            if (starValue <= ratingValue) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    } else {
        // console.warn('No stars found in highlightStars'); // Optional warning
    }
}

function handleStarHover(event) {
    if (event.target.tagName === 'I' && event.target.closest('#modalStarRating')) {
        const ratingValue = parseInt(event.target.dataset.value);
        highlightStars(ratingValue);
    }
}

function handleStarMouseOut() {
    // Highlight based on the currently selected rating, or reset if none selected
    highlightStars(currentSelectedRating);
}

function handleStarClick(event) {
     if (event.target.tagName === 'I' && event.target.closest('#modalStarRating')) {
        currentSelectedRating = parseInt(event.target.dataset.value);
        const selectedRatingValueInput = document.getElementById('selectedRatingValue');
        if(selectedRatingValueInput) selectedRatingValueInput.value = currentSelectedRating;
        highlightStars(currentSelectedRating); // Keep them highlighted after click
        console.log(`Rating selected: ${currentSelectedRating} for item ${currentRatingItemId}`);
    }
}

// Add/Update this function to refresh the rating display on a card
function updateItemRatingDisplay(itemId, newAverageRating, newRatingCount) {
    console.log(`Updating rating display for ${itemId} to ${newAverageRating} (${newRatingCount})`);
    const ratingElement = document.getElementById(`rating-display-${itemId}`);
    if (ratingElement) {
        ratingElement.innerHTML = generateRatingStars(newAverageRating, newRatingCount);
    } else {
        console.warn(`Rating display element not found for item ${itemId}`);
    }
}

// Modify submitRating to call the update function on success
async function submitRating() {
    const itemId = document.getElementById('ratingItemId')?.value;
    const ratingValueStr = document.getElementById('selectedRatingValue')?.value;
    const rating = parseInt(ratingValueStr);

    if (!itemId || !rating || rating < 1 || rating > 5) {
        showToast('Please select a rating (1-5 stars).', 'error');
        return;
    }

    console.log(`Submitting rating ${rating} for item ${itemId}`);

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
             showToast('Please log in to rate items.', 'error');
             if (ratingModalInstance) ratingModalInstance.hide();
             return;
        }

        const response = await fetch(`http://localhost:5000/api/dishes/${itemId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating: rating })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to submit rating.' }));
            throw new Error(errorData.message || `Failed to submit rating (${response.status})`);
        }

        const result = await response.json(); // Assume backend returns { success: true, newAverageRating: 4.6, newRatingCount: 15 }
        showToast('Thank you for your rating!', 'success');
        if (ratingModalInstance) ratingModalInstance.hide();

        // Update the specific item's rating display on the page
        if (result && result.newAverageRating !== undefined) {
             // Update item in the main menuItems array as well (optional but good practice)
             const ratedItemIndex = menuItems.findIndex(item => item._id === itemId);
             if (ratedItemIndex > -1) {
                 menuItems[ratedItemIndex].averageRating = result.newAverageRating;
                 if (result.newRatingCount !== undefined) {
                    menuItems[ratedItemIndex].ratingCount = result.newRatingCount;
                 }
             }
             // Update the DOM
             updateItemRatingDisplay(itemId, result.newAverageRating, result.newRatingCount);
        } else {
            console.warn('Backend did not return new rating info after submission.');
            // Optional: Could trigger a full menu reload here if needed
            // loadMenuItems(); 
        }

    } catch (error) {
        console.error('Error submitting rating:', error);
        showToast(error.message || 'Failed to submit rating. Please try again.', 'error');
        if (ratingModalInstance) ratingModalInstance.hide(); 
    }
}

// --- End Rating Functions ---

// --- New Functions for Dish Detail Modal ---

function openDishDetailsModal(itemId) {
    console.log('Attempting to open details for:', itemId);
    const item = menuItems.find(i => i._id === itemId);
    
    if (!item) {
        console.error('Item data not found for ID:', itemId);
        showToast('Could not load dish details.', 'error');
        return;
    }
    
    if (!dishDetailModalInstance) {
        console.error('Dish Detail Modal instance is not available.');
        showToast('Could not display dish details.', 'error');
        return;
    }
    
    // Populate Modal Content
    document.getElementById('dishDetailModalLabel').textContent = item.name || 'Dish Details';
    document.getElementById('dishDetailName').textContent = item.name || 'N/A';
    document.getElementById('dishDetailDescription').textContent = item.description || 'No description available.';
    document.getElementById('dishDetailPrice').textContent = `₹${(item.price || 0).toFixed(2)}`;
    document.getElementById('dishDetailImage').src = item.image || '../images/default-profile.png';
    document.getElementById('dishDetailImage').alt = item.name || 'Dish image';
    
    // Populate Nutrition
    const nutritionContainer = document.getElementById('dishDetailNutrition');
    nutritionContainer.innerHTML = ''; // Clear previous
    if (item.nutrition && typeof item.nutrition === 'object') {
        // Add common nutrition facts if they exist
        if (item.nutrition.servingSize) nutritionContainer.innerHTML += `<li class="list-group-item"><span class="text-muted">Serving Size:</span> <span>${item.nutrition.servingSize}</span></li>`;
        if (item.nutrition.calories !== undefined) nutritionContainer.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>Calories:</span> <span>${item.nutrition.calories} kcal</span></li>`;
        if (item.nutrition.protein !== undefined) nutritionContainer.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>Protein:</span> <span>${item.nutrition.protein} g</span></li>`;
        if (item.nutrition.carbs !== undefined) nutritionContainer.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>Carbohydrates:</span> <span>${item.nutrition.carbs} g</span></li>`;
        if (item.nutrition.fat !== undefined) nutritionContainer.innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>Fat:</span> <span>${item.nutrition.fat} g</span></li>`;
        // Add more nutrition facts as needed (e.g., fiber, sugar, sodium)
    } else {
        nutritionContainer.innerHTML = '<li class="list-group-item text-muted">Nutritional information not available.</li>';
    }

    // Update the Add to Cart button in the modal with the correct item ID
    const modalCartBtn = document.querySelector('#dishDetailModal .add-to-cart-from-modal');
    if (modalCartBtn) {
        modalCartBtn.dataset.id = itemId; 
    }

    // Show the modal
    dishDetailModalInstance.show();
}

function handleAddToCartFromModal(event) {
    const button = event.target.closest('.add-to-cart-from-modal');
    const itemId = button?.dataset.id;

    if (!itemId) {
        console.error('Could not get item ID from modal cart button.');
        showToast('Error adding item.', 'error');
        return;
    }

    const itemToAdd = menuItems.find(item => item._id === itemId);
    if (itemToAdd) {
        addToCart(itemToAdd);
        showToast(`${itemToAdd.name} added to cart!`, 'success');
        // Optionally close the modal after adding to cart
        // if (dishDetailModalInstance) dishDetailModalInstance.hide(); 
    } else {
        console.error(`Could not find item with ID ${itemId} to add from modal.`);
        showToast('Error adding item to cart.', 'error');
    }
}