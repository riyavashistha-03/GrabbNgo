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
    
    cartLink.addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
    });
    
    closeCartButton.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    checkoutButton.addEventListener('click', async function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        try {
            const response = await fetch('https://your-backend-api.com/api/orders', {
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
    
    // Functions
    async function fetchMenuItems() {
        try {
            const response = await fetch('https://your-backend-api.com/api/menu');
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
            const itemElement = document.createElement('div');
            itemElement.className = 'menu-item';
            itemElement.dataset.id = item.id;
            itemElement.dataset.category = item.category;
            itemElement.dataset.vegetarian = item.vegetarian ? 'true' : 'false';
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.image || '../images/default-dish.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-description">${item.description || ''}</p>
                    <p class="item-price">$${item.price.toFixed(2)}</p>
                    <button class="btn btn-add-to-cart">Add to Cart</button>
                </div>
            `;
            menuItemsContainer.appendChild(itemElement);
        });
        // Update menuItems NodeList for filtering and searching
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
                    return parseFloat(a.querySelector('.item-price').textContent.replace('$', '')) - 
                           parseFloat(b.querySelector('.item-price').textContent.replace('$', ''));
                case 'price-desc':
                    return parseFloat(b.querySelector('.item-price').textContent.replace('$', '')) - 
                           parseFloat(a.querySelector('.item-price').textContent.replace('$', ''));
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
        const itemPrice = parseFloat(menuItem.querySelector('.item-price').textContent.replace('$', ''));
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
            subtotalElement.textContent = '$0.00';
            taxElement.textContent = '$0.00';
            totalElement.textContent = '$0.00';
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
                        <p>$${item.price.toFixed(2)}</p>
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
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
        
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
