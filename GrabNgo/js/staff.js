// Staff Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Load staff name from localStorage or default
    const staffNameElement = document.getElementById('staffName');
    if (staffNameElement) {
        const staffName = localStorage.getItem('staffName') || 'Admin';
        staffNameElement.textContent = staffName;
    }
    
    // Update stats from backend API
    updateDashboardStats();
    
    // Fetch and render recent orders dynamically
    fetchAndRenderRecentOrders();
    
    // Fetch and render popular dishes dynamically
    fetchAndRenderPopularDishes();
    
    // Setup quick add dish modal
    setupQuickAddDish();
    
    // Setup order status buttons
    setupOrderStatusButtons();
    
    // Initialize other components
    initializeComponents();
    
    // Fetch and render current menu items on add-dish page
    fetchAndRenderMenuItems();
});

async function updateDashboardStats() {
    try {
        const response = await fetch('/api/staff/stats', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        const stats = await response.json();
        document.getElementById('menuItemsCount').textContent = stats.menuItems;
        document.getElementById('todayOrders').textContent = stats.todayOrders;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('todayRevenue').textContent = formatCurrency(stats.todayRevenue);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

async function fetchAndRenderRecentOrders() {
    try {
        const response = await fetch('/api/staff/orders', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch recent orders');
        }
        const orders = await response.json();
        const tbody = document.querySelector('.orders-table tbody');
        tbody.innerHTML = '';
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#ORD-${order._id.slice(-6)}</td>
                <td>${order.user ? order.user.name : 'Unknown'}</td>
                <td>${order.items.length}</td>
                <td>${formatCurrency(order.totalPrice)}</td>
                <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
                <td><button class="btn btn-action">Update</button></td>
            `;
            tbody.appendChild(tr);
        });
        setupOrderStatusButtons();
    } catch (error) {
        console.error('Error fetching recent orders:', error);
    }
}

async function fetchAndRenderPopularDishes() {
    try {
        const response = await fetch('/api/staff/reports', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        const dishesGrid = document.querySelector('.popular-dishes .dishes-grid');
        if (!dishesGrid) return;
        dishesGrid.innerHTML = '';
        data.popularDishes.forEach(dish => {
            const dishCard = document.createElement('div');
            dishCard.className = 'dish-card';
            dishCard.innerHTML = `
                <div class="dish-image">
                    <img src="../images/dish-placeholder.jpg" alt="${dish.name}">
                </div>
                <div class="dish-info">
                    <h3>${dish.name}</h3>
                    <p class="dish-sales">${dish.totalQuantity} orders this week</p>
                </div>
            `;
            dishesGrid.appendChild(dishCard);
        });
    } catch (error) {
        console.error('Error fetching popular dishes:', error);
    }
}

async function fetchAndRenderMenuItems() {
    if (!document.querySelector('.menu-items-grid')) return;
    try {
        const response = await fetch('/api/dishes', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch menu items');
        }
        const dishes = await response.json();
        const menuGrid = document.querySelector('.menu-items-grid');
        menuGrid.innerHTML = '';
        dishes.forEach(dish => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `
                <div class="item-image">
                    <img src="../images/dish-placeholder.jpg" alt="${dish.name}">
                </div>
                <div class="item-details">
                    <h4>${dish.name}</h4>
                    <p class="item-category">${dish.category}</p>
                    <p class="item-price">${formatCurrency(dish.price)}</p>
                    <div class="item-actions">
                        <button class="btn btn-edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

function setupOrderStatusButtons() {
    document.querySelectorAll('.orders-table .btn-action').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const orderId = row.querySelector('td:first-child').textContent.replace('#ORD-', '');
            const currentStatus = row.querySelector('.status').textContent;
            
            const newStatus = prompt(`Update status for order ${orderId} (Current: ${currentStatus})`, currentStatus);
            
            if (newStatus && newStatus !== currentStatus) {
                try {
                    const response = await fetch(`/api/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update order status');
                    }
                    
                    const statusSpan = row.querySelector('.status');
                    statusSpan.textContent = newStatus;
                    statusSpan.className = 'status';
                    
                    if (newStatus.toLowerCase().includes('preparing')) {
                        statusSpan.classList.add('preparing');
                    } else if (newStatus.toLowerCase().includes('ready')) {
                        statusSpan.classList.add('ready');
                    } else if (newStatus.toLowerCase().includes('complete')) {
                        statusSpan.classList.add('completed');
                    }
                    
                    showSuccessMessage(`Order ${orderId} status updated to ${newStatus}`);
                } catch (error) {
                    showErrorMessage('Error updating order status: ' + error.message);
                }
            }
        });
    });
}

function updateMenuItemsCount() {
    const count = document.querySelectorAll('.menu-item').length;
    document.getElementById('menuItemsCount').textContent = count;
}

function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showTooltip(e) {
    const tooltipText = this.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    
    document.body.appendChild(tooltip);
    
    const rect = this.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
    
    this.tooltip = tooltip;
}

function hideTooltip() {
    if (this.tooltip) {
        this.tooltip.remove();
    }
}

function updateRelativeTimes() {
    document.querySelectorAll('[data-time]').forEach(element => {
        const timestamp = element.getAttribute('data-time');
        element.textContent = timeago.format(new Date(timestamp));
    });
    
    // Update every minute
    setTimeout(updateRelativeTimes, 60000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
