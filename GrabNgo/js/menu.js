// User Menu JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const menuItemsContainer = document.querySelector('.menu-items-grid');
    const categoryFilters = document.querySelectorAll('.categories li');
    const checkboxes = document.querySelectorAll('.filter-option input');
    const sortSelect = document.getElementById('sortBy');
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    const cartCount = document.querySelector('.cart-count');
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalElement = document.querySelector('.subtotal');
    const taxElement = document.querySelector('.tax');
    const totalElement = document.querySelector('.total-amount');
    const checkoutButton = document.querySelector('.btn-checkout');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCartButton = document.querySelector('.btn-close-cart');
    const cartLink = document.querySelector('a[href="#"]'); // Update this selector based on your actual cart link

    // Cart state
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Initialize the page
    fetchMenuItems();
    updateCartCount();
    renderCartItems();

    // Event Listeners
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            filterMenuItems();
        });
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterMenuItems);
    });

    sortSelect.addEventListener('change', sortMenuItems);

    searchButton.addEventListener('click', searchMenuItems);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') searchMenuItems();
    });

    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    };

    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', async function() {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            try {
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ items: cart })
                });
                if (!response.ok) {
                    throw new Error('Failed to place order');
                }
                alert('Order placed successfully!');
                cart = [];
                localStorage.removeItem('cart');
                updateCartCount();
                renderCartItems();
                closeCart();
            } catch (error) {
                alert('Error placing order: ' + error.message);
            }
        });
    }
    // Functions
    async function fetchMenuItems() {
        try {
            const response = await fetch('http://localhost:5000/api/dishes');
            if (!response.ok) {
                throw new Error('Failed to fetch menu items');
            }
            const menuItems = await response.json();
            renderMenuItems(menuItems);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    }

    function renderMenuItems(menuItems) {
        if (!menuItemsContainer) return;
        menuItemsContainer.innerHTML = '';
        menuItems.forEach(item => {
            if (item.price === undefined || item.price === null) {
                console.warn(`Dish ${item.name} is missing price, skipping.`);
                return;
            }
            const itemElement = document.createElement('div');
            itemElement.className = 'menu-item';
            itemElement.dataset.id = item._id || item.id;
            itemElement.dataset.category = item.category || '';
            itemElement.dataset.vegetarian = item.vegetarian ? 'true' : 'false';
            let imageUrl = item.imageUrl ? item.imageUrl : '../images/default-dish.jpg';
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `http://localhost:5000/${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}`;
            }
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${imageUrl}" alt="${item.name}" />
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-description">${item.description || ''}</p>
            <p class="item-price">₹${item.price.toFixed(2)}</p>
            <div class="item-rating" data-dish-id="${item._id}">
                <span class="average-rating">${item.averageRating ? item.averageRating.toFixed(1) : '0.0'}</span>
                <span class="stars">
                    ${renderStars(item.averageRating)}
                </span>
                <button class="btn btn-rate">Rate</button>
            </div>
            <button class="btn btn-add-to-cart">Add to Cart</button>
        </div>
    `;
    menuItemsContainer.appendChild(itemElement);
});

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    return starsHtml;
}

// Event delegation for rate buttons
menuItemsContainer.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-rate')) {
        const ratingContainer = event.target.closest('.item-rating');
        if (!ratingContainer) return;
        const dishId = ratingContainer.dataset.dishId;
        openRatingModal(dishId, ratingContainer);
    }
});

function openRatingModal(dishId, ratingContainer) {
    // Create popup box elements
    const popup = document.createElement('div');
    popup.className = 'rating-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Rate this dish</h3>
            <div class="star-rating">
                <i class="far fa-star" data-value="1"></i>
                <i class="far fa-star" data-value="2"></i>
                <i class="far fa-star" data-value="3"></i>
                <i class="far fa-star" data-value="4"></i>
                <i class="far fa-star" data-value="5"></i>
            </div>
            <button class="btn btn-submit-rating" disabled>Submit</button>
            <button class="btn btn-cancel-rating">Cancel</button>
        </div>
    `;
    document.body.appendChild(popup);

    let selectedRating = 0;
    const stars = popup.querySelectorAll('.star-rating i');
    const submitBtn = popup.querySelector('.btn-submit-rating');
    const cancelBtn = popup.querySelector('.btn-cancel-rating');

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            highlightStars(stars, star.dataset.value);
        });
        star.addEventListener('mouseleave', () => {
            highlightStars(stars, selectedRating);
        });
        star.addEventListener('click', () => {
            selectedRating = star.dataset.value;
            highlightStars(stars, selectedRating);
            submitBtn.disabled = false;
        });
    });

    submitBtn.addEventListener('click', async () => {
        if (selectedRating > 0) {
            try {
                const response = await fetch(`http://localhost:5000/api/dishes/${dishId}/rate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ rating: Number(selectedRating) })
                });
                if (!response.ok) {
                    throw new Error('Failed to submit rating');
                }
                const data = await response.json();
                // Update UI with new average rating
                ratingContainer.querySelector('.average-rating').textContent = data.averageRating.toFixed(1);
                ratingContainer.querySelector('.stars').innerHTML = renderStars(data.averageRating);
                alert('Rating submitted successfully');
                document.body.removeChild(popup);
            } catch (error) {
                alert('Error submitting rating: ' + error.message);
            }
        }
    });

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

function highlightStars(stars, count) {
    stars.forEach(star => {
        if (star.dataset.value <= count) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}
        // Add event listeners for add to cart buttons
        menuItemsContainer.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const menuItem = this.closest('.menu-item');
                addToCart(menuItem);
            });
        });
    }

    function filterMenuItems() {
        const activeCategory = document.querySelector('.categories li.active').dataset.category;
        const vegetarianChecked = document.getElementById('vegetarian').checked;

        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const itemCategory = item.dataset.category;
            const isVegetarian = item.dataset.vegetarian === 'true';

            const categoryMatch = activeCategory === 'all' || itemCategory === activeCategory;
            const vegetarianMatch = !vegetarianChecked || isVegetarian;

            if (categoryMatch && vegetarianMatch) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    function sortMenuItems() {
        const sortValue = sortSelect.value;
        const menuContainer = document.querySelector('.menu-items-grid');
        const items = Array.from(document.querySelectorAll('.menu-item'));

        items.sort((a, b) => {
            switch(sortValue) {
                case 'price-asc':
                    return parseFloat(a.querySelector('.item-price').textContent.replace('₹', '')) -
                           parseFloat(b.querySelector('.item-price').textContent.replace('₹', ''));
                case 'price-desc':
                    return parseFloat(b.querySelector('.item-price').textContent.replace('₹', '')) -
                           parseFloat(a.querySelector('.item-price').textContent.replace('₹', ''));
                case 'name':
                    return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
                case 'popular':
                default:
                    return 0;
            }
        });

        items.forEach(item => menuContainer.appendChild(item));
    }

    function searchMenuItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            const itemName = item.querySelector('h3').textContent.toLowerCase();
            const itemDescription = item.querySelector('.item-description').textContent.toLowerCase();

            if (itemName.includes(searchTerm) || itemDescription.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function addToCart(menuItem) {
        const itemId = menuItem.dataset.id;
        const itemName = menuItem.querySelector('h3').textContent;
        const itemPrice = parseFloat(menuItem.querySelector('.item-price').textContent.replace('₹', ''));
        const itemImage = menuItem.querySelector('.item-image img').src;

        const existingItem = cart.find(item => item.id === itemId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: itemId,
                name: itemName,
                price: itemPrice,
                image: itemImage,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
        showAddToCartConfirmation(itemName);
    }

    function updateCartCount() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    function renderCartItems() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            subtotalElement.textContent = '₹0.00';
            taxElement.textContent = '₹0.00';
            totalElement.textContent = '₹0.00';
            return;
        }

        let cartHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            subtotal += item.price * item.quantity;

            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>₹${item.price.toFixed(2)}</p>
                        <div class="cart-item-quantity">
                            <button class="btn-quantity btn-decrease"><i class="fas fa-minus"></i></button>
                            <span>${item.quantity}</span>
                            <button class="btn-quantity btn-increase"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="cart-item-remove">
                        <button class="btn-remove"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        const tax = subtotal * 0.10; // 10% tax
        const total = subtotal + tax;

        cartItemsContainer.innerHTML = cartHTML;
        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
        taxElement.textContent = `₹${tax.toFixed(2)}`;
        totalElement.textContent = `₹${total.toFixed(2)}`;

        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                removeFromCart(itemId);
            });
        });

        document.querySelectorAll('.btn-decrease').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                updateCartItemQuantity(itemId, -1);
            });
        });

        document.querySelectorAll('.btn-increase').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.closest('.cart-item').dataset.id;
                updateCartItemQuantity(itemId, 1);
            });
        });
    }

    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }

    function updateCartItemQuantity(itemId, change) {
        const item = cart.find(item => item.id === itemId);

        if (item) {
            item.quantity += change;

            if (item.quantity <= 0) {
                removeFromCart(itemId);
            } else {
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                renderCartItems();
            }
        }
    }

    function showAddToCartConfirmation(itemName) {
        const confirmation = document.createElement('div');
        confirmation.className = 'add-to-cart-confirmation';
        confirmation.innerHTML = `
            <p>Added ${itemName} to cart</p>
        `;
        document.body.appendChild(confirmation);

        setTimeout(() => {
            confirmation.classList.add('show');
        }, 10);

        setTimeout(() => {
            confirmation.classList.remove('show');
            setTimeout(() => {
                confirmation.remove();
            }, 300);
        }, 2000);
    }

    function openCart() {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
});
