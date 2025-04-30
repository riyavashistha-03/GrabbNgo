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
                'Authorization': 'Bearer ' + localStorage.getItem('staffAuthToken'),
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
            // Ensure orders have necessary properties before updating table
            const validOrders = orders.filter(o => o && o.id && o.customerName && o.items && o.totalAmount !== undefined && o.status && o.date);
            if(validOrders.length !== orders.length) {
                console.warn('Some orders were filtered out due to missing data:', orders.filter(o => !validOrders.includes(o)));
            }
            updateOrdersTable(validOrders); 
            updateOrdersSubtitle(validOrders.length);
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
            const orderId = order.id; // Use the correct ID from formatted data
            const status = order.status || 'Pending'; // Default status if missing
            tableHTML += `
                <tr data-order-row-id="${orderId}"> 
                    <td>#${orderId.substring(orderId.length - 6)}</td> // Show last 6 chars for brevity
                    <td>${order.customerName}</td>
                    <td>${order.items.length} Items</td>
                    <td>₹${order.totalAmount.toFixed(2)}</td> 
                    <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td>
                        <button 
                            class="btn btn-sm btn-outline-primary action-btn update-status-btn" 
                            data-bs-toggle="modal" 
                            data-bs-target="#statusUpdateModal" 
                            data-order-id="${orderId}"
                            title="Update Status">
                            <i class="fas fa-edit"></i> Update
                        </button>
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

    // -- Helper Functions (Copied from dashboard) --
    function getStatusBadgeClass(status) {
        switch(status.toLowerCase()) {
            case 'pending': return 'bg-warning text-dark'; // Match modal button style
            case 'preparing': return 'bg-info';
            case 'ready': return 'bg-success';
            case 'ready for pickup': return 'bg-success'; // Handle variation
            case 'out for delivery': return 'bg-primary';
            case 'delivered': return 'bg-secondary';
            case 'cancelled': return 'bg-danger';
            default: return 'bg-light text-dark'; // Default fallback
        }
    }

    // Function to update order status via API
    async function updateOrderStatus(orderId, newStatus) {
      console.log(`Attempting to update order ${orderId} to status ${newStatus}`);
      const token = localStorage.getItem('staffAuthToken');
      if (!token) {
          alert('Authentication error. Please log in again.');
          return false;
      }
      
      try {
          const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
              method: 'PUT', 
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: newStatus })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json(); // Get updated order from response
          console.log(`Order ${orderId} status updated successfully to ${newStatus}`);
          return true; // Indicate success

      } catch (error) {
          console.error('Error updating order status:', error);
          alert('Failed to update order status: ' + error.message);
          return false; // Indicate failure
      }
    }
    // -- End Helper Functions --

    // -- Modal JS Logic (Copied from dashboard) --
    const statusUpdateModal = document.getElementById('statusUpdateModal');
    const modalOrderIdElement = document.getElementById('modalOrderId');
    let currentOrderId = null;
    const modalInstance = statusUpdateModal ? new bootstrap.Modal(statusUpdateModal) : null;

    if(modalInstance) {
        // When the modal is shown, store the order ID
        statusUpdateModal.addEventListener('show.bs.modal', function (event) {
          const button = event.relatedTarget; // Button that triggered the modal
          currentOrderId = button.getAttribute('data-order-id');
          modalOrderIdElement.textContent = currentOrderId ? currentOrderId.substring(currentOrderId.length - 6) : 'N/A'; // Show partial ID
        });

        // Add event listeners to status buttons inside the modal
        statusUpdateModal.querySelectorAll('.status-update-btn').forEach(button => {
          button.addEventListener('click', async (event) => {
            const newStatus = event.target.getAttribute('data-status');
            if (currentOrderId && newStatus) {
              const success = await updateOrderStatus(currentOrderId, newStatus);
              if (success) {
                // Update the table row immediately
                const tableRow = document.querySelector(`tr[data-order-row-id="${currentOrderId}"]`);
                if (tableRow) {
                  const statusBadge = tableRow.querySelector('td:nth-child(5) span.status-badge'); // 5th column for Status
                  if (statusBadge) {
                    statusBadge.textContent = newStatus;
                    // Update badge class based on status (assuming getStatusBadgeClass handles CSS classes)
                    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`; // Simple class update
                     // If getStatusBadgeClass returns Bootstrap bg-* classes, use this instead:
                    // statusBadge.className = `badge ${getStatusBadgeClass(newStatus)}`; 
                  }
                }
                modalInstance.hide(); // Close modal on success
              }
              // Optional: Add loading indicator while fetch is in progress
            }
          });
        });
    }
    // -- End Modal JS Logic --

    // Initialize
    loadUserData();
    loadOrdersData();
});