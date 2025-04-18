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
    
    // Setup quick add dish modal
    setupQuickAddDish();
    
    // Setup order status buttons
    setupOrderStatusButtons();
    
    // Initialize other components
    initializeComponents();
});

async function updateDashboardStats() {
    try {
        const response = await fetch('https://your-backend-api.com/api/staff/stats', {
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
        document.getElementById('todayRevenue').textContent = `$${stats.todayRevenue.toLocaleString()}`;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

function initializeComponents() {
    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    // Initialize timeago
    updateRelativeTimes();
}

function setupQuickAddDish() {
    const quickAddBtn = document.getElementById('quickAddDish');
    const quickAddModal = document.getElementById('quickAddModal');
    const closeBtn = document.querySelector('.btn-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const quickAddForm = document.getElementById('quickAddForm');
    const quickDishImage = document.getElementById('quickDishImage');
    const quickImagePreview = document.getElementById('quickPreviewImage');
    
    if (!quickAddBtn) return;
    
    // Open modal
    quickAddBtn.addEventListener('click', function() {
        quickAddModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    function closeModal() {
        quickAddModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === quickAddModal) {
            closeModal();
        }
    });
    
    // Image preview
    quickDishImage.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                quickImagePreview.src = e.target.result;
                quickImagePreview.style.display = 'block';
            }
            
            reader.readAsDataURL(file);
        }
    });
    
    // Handle form submission
    quickAddForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const dishName = document.getElementById('quickDishName').value;
        const dishPrice = document.getElementById('quickDishPrice').value;
        const dishCategory = document.getElementById('quickDishCategory').value;
        const dishImage = document.getElementById('quickDishImage').files[0];
        
        if (!dishName || !dishPrice) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('name', dishName);
            formData.append('price', dishPrice);
            formData.append('category', dishCategory);
            if (dishImage) {
                formData.append('image', dishImage);
            }
            
            const response = await fetch('https://your-backend-api.com/api/dishes', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                showErrorMessage('Failed to add dish: ' + (errorData.message || 'Unknown error'));
                return;
            }
            
            showSuccessMessage(`${dishName} added successfully!`);
            quickAddForm.reset();
            quickImagePreview.src = '';
            quickImagePreview.style.display = 'none';
            closeModal();
            updateMenuItemsCount();
        } catch (error) {
            showErrorMessage('Error adding dish: ' + error.message);
        }
    });
}

function setupOrderStatusButtons() {
    document.querySelectorAll('.orders-table .btn-action').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const orderId = row.querySelector('td:first-child').textContent;
            const currentStatus = row.querySelector('.status').textContent;
            
            const newStatus = prompt(`Update status for order ${orderId} (Current: ${currentStatus})`, currentStatus);
            
            if (newStatus && newStatus !== currentStatus) {
                try {
                    const response = await fetch(`https://your-backend-api.com/api/orders/${orderId}/status`, {
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
