document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    const ordersTableBody = document.getElementById('orders-table-body');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const newOrderBtn = document.getElementById('new-order-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');
    const ordersNotification = document.getElementById('orders-notification');
    const dashboardNotification = document.getElementById('dashboard-notification');
    const ordersSubtitle = document.getElementById('orders-subtitle');

    // Toggle sidebar on mobile
    sidebarToggle.addEventListener('click', function() {
        dashboardSidebar.classList.toggle('active');
    });

    // Load user data
    function loadUserData() {
        // In a real app, you would fetch this from your backend
        const userData = {
            name: "Admin User",
            avatar: "../images/delicious_img.jpg",
            notifications: {
                dashboard: 3,
                orders: 12
            }
        };

        // Update UI with user data
        usernameDisplay.textContent = userData.name;
        document.getElementById('user-avatar').src = userData.avatar;
        dashboardNotification.textContent = userData.notifications.dashboard;
        ordersNotification.textContent = userData.notifications.orders;
    }

    // Load orders data
    function loadOrdersData(filterStatus = 'all', filterDate = '') {
        // Show loading state
        ordersTableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Loading orders...
                </td>
            </tr>
        `;

        // In a real app, you would fetch from your API
        fetch('http://localhost:5000/api/orders', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            return response.json();
        })
        .then(orders => {
            updateOrdersTable(orders);
            updateOrdersSubtitle(orders.length);
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error loading orders. Please try again.
                    </td>
                </tr>
            `;
        });
    }

    // Update orders table with data
    function updateOrdersTable(orders) {
        if (orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        <i class="fas fa-clipboard-list me-2"></i>
                        No orders found
                    </td>
                </tr>
            `;
            return;
        }

        let tableHTML = '';
        orders.forEach(order => {
            tableHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${order.items.length} Items</td>
                    <td>$${order.totalAmount.toFixed(2)}</td>
                    <td><span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn view" data-order-id="${order.id}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit" data-order-id="${order.id}"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `;
        });

        ordersTableBody.innerHTML = tableHTML;
        addOrderActionListeners();
    }

    // Update orders subtitle with count
    function updateOrdersSubtitle(count) {
        ordersSubtitle.textContent = count === 0 ? 'No orders found' : `Showing ${count} recent orders`;
    }

    // Add event listeners to order action buttons
    function addOrderActionListeners() {
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });

        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                editOrder(orderId);
            });
        });
    }

    // View order details
    function viewOrderDetails(orderId) {
        console.log('Viewing order:', orderId);
        // In a real app, you would navigate to order details page or show a modal
    }

    // Edit order
    function editOrder(orderId) {
        console.log('Editing order:', orderId);
        // In a real app, you would navigate to order edit page
    }

    // Apply filters
    applyFiltersBtn.addEventListener('click', function() {
        const status = statusFilter.value;
        const date = dateFilter.value;
        loadOrdersData(status, date);
    });

    // New order button
    newOrderBtn.addEventListener('click', function() {
        // In a real app, you would navigate to new order page
        console.log('Creating new order');
    });

    // Logout
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // In a real app, you would call your logout API
        localStorage.removeItem('authToken');
        window.location.href = '../index.html';
    });

    // Initialize
    loadUserData();
    loadOrdersData();
});