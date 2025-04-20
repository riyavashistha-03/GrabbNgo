// Staff Dashboard JavaScript
function setupQuickAddDish() {
  // Placeholder for setupQuickAddDish function
  // Implement any quick add dish modal or functionality here if needed
  console.log("setupQuickAddDish function called");
}

document.addEventListener("DOMContentLoaded", function () {
  setupQuickAddDish();

  // Add dish form submission handler
  const addDishForm = document.getElementById("addDishForm");
  if (addDishForm) {
    addDishForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const dishName = document.getElementById("dishName").value.trim();
      const dishCategory = document.getElementById("dishCategory").value;
      const dishPrice = parseFloat(document.getElementById("dishPrice").value);
      const dishAvailability =
        document.getElementById("dishAvailability").value;
      const dishDescription = document
        .getElementById("dishDescription")
        .value.trim();
      const dishImageInput = document.getElementById("dishImage");
      const vegetarian = document.getElementById("vegetarian").checked;
      const vegan = document.getElementById("vegan").checked;
      const glutenFree = document.getElementById("glutenFree").checked;

      // Prepare form data for image upload if needed
      const formData = new FormData();
      formData.append("name", dishName);
      formData.append("category", dishCategory);
      formData.append("price", dishPrice);
      formData.append("availability", dishAvailability);
      formData.append("description", dishDescription);
      formData.append("vegetarian", vegetarian);
      formData.append("vegan", vegan);
      formData.append("glutenFree", glutenFree);

      if (dishImageInput.files.length > 0) {
        formData.append("image", dishImageInput.files[0]);
      }

      try {
        const response = await fetch("http://localhost:5000/api/dishes", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("authToken"),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to add dish");
        }

        alert("Dish added successfully");
        addDishForm.reset();
        // Optionally refresh the menu or UI here
      } catch (error) {
        alert("Error adding dish: " + error.message);
      }
    });
  }
  // Load staff name from localStorage or default
  const staffNameElement = document.getElementById("staffName");
  if (staffNameElement) {
    const staffName = localStorage.getItem("staffName") || "Admin";
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

  // Setup edit and delete buttons for menu items
  setupMenuItemActions();
});

// Utility function to format currency with Indian Rupee symbol
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// Setup edit and delete button event listeners for menu items
function setupMenuItemActions() {
  const menuGrid = document.querySelector(".menu-items-grid");
  if (!menuGrid) return;

  menuGrid.addEventListener("click", async (event) => {
    const target = event.target;
    const menuItem = target.closest(".menu-item");
    if (!menuItem) return;

    const dishId = menuItem.dataset.id;

    if (target.closest(".btn-edit")) {
      // Handle edit dish
      openEditDishModal(dishId);
    } else if (target.closest(".btn-delete")) {
      // Handle delete dish
      if (confirm("Are you sure you want to delete this dish?")) {
        try {
          const response = await fetch(`/api/dishes/${dishId}`, {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + localStorage.getItem("authToken"),
            },
          });
          if (!response.ok) {
            throw new Error("Failed to delete dish");
          }
          alert("Dish deleted successfully");
          fetchAndRenderMenuItems(); // Refresh menu items
        } catch (error) {
          alert("Error deleting dish: " + error.message);
        }
      }
    }
  });
}

// Open edit dish modal and populate with dish data
async function openEditDishModal(dishId) {
  try {
    const response = await fetch(`http://localhost:5000/api/dishes/${dishId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("authToken"),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch dish details");
    }
    const dish = await response.json();

    // Assuming there is a modal similar to quickAddModal for editing
    const editModal = document.getElementById("editDishModal");
    if (!editModal) {
      alert("Edit modal not implemented");
      return;
    }

    // Populate modal fields with dish data
    editModal.querySelector("#editDishName").value = dish.name || "";
    editModal.querySelector("#editDishPrice").value = dish.price || "";
    editModal.querySelector("#editDishCategory").value = dish.category || "";
    editModal.querySelector("#editDishAvailability").value =
      dish.availability || "available";
    editModal.querySelector("#editDishDescription").value =
      dish.description || "";

    // Show modal
    editModal.style.display = "block";

    // Setup save button handler
    const saveButton = editModal.querySelector(".btn-save");
    saveButton.onclick = async () => {
      const updatedDish = {
        name: editModal.querySelector("#editDishName").value,
        price: parseFloat(editModal.querySelector("#editDishPrice").value),
        category: editModal.querySelector("#editDishCategory").value,
        availability: editModal.querySelector("#editDishAvailability").value,
        description: editModal.querySelector("#editDishDescription").value,
      };

      try {
        const updateResponse = await fetch(`/api/dishes/${dishId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("authToken"),
          },
          body: JSON.stringify(updatedDish),
        });
        if (!updateResponse.ok) {
          throw new Error("Failed to update dish");
        }
        alert("Dish updated successfully");
        editModal.style.display = "none";
        fetchAndRenderMenuItems(); // Refresh menu items
      } catch (error) {
        alert("Error updating dish: " + error.message);
      }
    };

    // Setup cancel button handler
    const cancelButton = editModal.querySelector(".btn-cancel");
    cancelButton.onclick = () => {
      editModal.style.display = "none";
    };
  } catch (error) {
    alert("Error fetching dish details: " + error.message);
  }
}

async function updateDashboardStats() {
  try {
    const response = await fetch("http://localhost:5000/api/staff/stats", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("authToken"),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }
    const stats = await response.json();
    document.getElementById("menuItemsCount").textContent = stats.menuItems;
    document.getElementById("todayOrders").textContent = stats.todayOrders;
    document.getElementById("activeUsers").textContent = stats.activeUsers;
    document.getElementById("todayRevenue").textContent = formatCurrency(
      stats.todayRevenue
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
}

async function fetchAndRenderRecentOrders() {
  try {
    const response = await fetch("http://localhost:5000/api/staff/orders", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("authToken"),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch recent orders");
    }
    const orders = await response.json();
    const tbody = document.querySelector(".orders-table tbody");
    tbody.innerHTML = "";
    orders.forEach((order) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>#ORD-${order._id.slice(-6)}</td>
                <td>${order.user ? order.user.name : "Unknown"}</td>
                <td>${order.items.length}</td>
                <td>${formatCurrency(order.totalPrice)}</td>
                <td><span class="status ${order.status.toLowerCase()}">${
        order.status
      }</span></td>
                <td><button class="btn btn-action">Update</button></td>
            `;
      tbody.appendChild(tr);
    });
    setupOrderStatusButtons();
  } catch (error) {
    console.error("Error fetching recent orders:", error);
  }
}

async function fetchAndRenderPopularDishes() {
  try {
    const response = await fetch("http://localhost:5000/api/staff/reports", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("authToken"),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch reports");
    }
    const data = await response.json();
    const dishesGrid = document.querySelector(".popular-dishes .dishes-grid");
    if (!dishesGrid) return;
    dishesGrid.innerHTML = "";
    data.popularDishes.forEach((dish) => {
      const dishCard = document.createElement("div");
      dishCard.className = "dish-card";
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
    console.error("Error fetching popular dishes:", error);
  }
}

async function fetchAndRenderMenuItems() {
  if (!document.querySelector(".menu-items-grid")) return;
  try {
    const response = await fetch("http://localhost:5000/api/dishes", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("authToken"),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch menu items");
    }
    const dishes = await response.json();
    const menuGrid = document.querySelector(".menu-items-grid");
    menuGrid.innerHTML = "";
    dishes.forEach((dish) => {
      const menuItem = document.createElement("div");
      menuItem.className = "menu-item";
      menuItem.dataset.id = dish._id;
      menuItem.innerHTML = `
                <div class="item-image">
                    <img src="../images/dish-placeholder.jpg" alt="${
                      dish.name
                    }">
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
    console.error("Error fetching menu items:", error);
  }
}

function createStatusPopup() {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'statusPopupOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'none';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '2000';

    // Create popup container
    const popup = document.createElement('div');
    popup.style.background = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.width = '300px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

    // Popup content
    popup.innerHTML = `
        <h3>Update Order Status</h3>
        <select id="statusSelect" style="width: 100%; padding: 8px; font-size: 1rem; margin-bottom: 15px;">
            <option value="Preparing">Preparing</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Ready">Ready</option>
            <option value="Canceled">Canceled</option>
        </select>
        <div>
            <button id="btnConfirmStatus" style="padding: 8px 12px; font-size: 1rem; margin-right: 10px; cursor: pointer; background-color: #283618; color: white; border: none; border-radius: 4px;">Confirm</button>
            <button id="btnCancelStatus" style="padding: 8px 12px; font-size: 1rem; cursor: pointer; background-color: #ddd; border: none; border-radius: 4px;">Cancel</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    return overlay;
}

let statusPopup = null;
let currentRow = null;

function createStatusPopup() {
    if (statusPopup) return statusPopup; // Create once

    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'statusPopupOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'none';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '2000';

    // Create popup container
    const popup = document.createElement('div');
    popup.style.background = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.width = '300px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

    // Popup content
    popup.innerHTML = `
        <h3>Update Order Status</h3>
        <select id="statusSelect" style="width: 100%; padding: 8px; font-size: 1rem; margin-bottom: 15px;">
            <option value="Preparing">Preparing</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Ready">Ready</option>
            <option value="Canceled">Canceled</option>
        </select>
        <div>
            <button id="btnConfirmStatus" style="padding: 8px 12px; font-size: 1rem; margin-right: 10px; cursor: pointer; background-color: #283618; color: white; border: none; border-radius: 4px;">Confirm</button>
            <button id="btnCancelStatus" style="padding: 8px 12px; font-size: 1rem; cursor: pointer; background-color: #ddd; border: none; border-radius: 4px;">Cancel</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Attach event listeners once
    document.getElementById('btnCancelStatus').addEventListener('click', () => {
        console.log('Cancel button clicked');
        closeStatusPopup();
    });

    document.getElementById('btnConfirmStatus').addEventListener('click', async () => {
        console.log('Confirm button clicked');
        if (!currentRow) return;
        const statusSelect = document.getElementById('statusSelect');
        const newStatus = statusSelect.value;
        const orderId = currentRow.querySelector('td:first-child').textContent.replace('#ORD-', '');
        const currentStatusCell = currentRow.querySelector('.status');

        if (newStatus && newStatus !== currentStatusCell.textContent) {
            try {
                const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
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

                currentStatusCell.textContent = newStatus;
                currentStatusCell.className = 'status';

                if (newStatus.toLowerCase().includes('preparing')) {
                    currentStatusCell.classList.add('preparing');
                } else if (newStatus.toLowerCase().includes('ready')) {
                    currentStatusCell.classList.add('ready');
                } else if (newStatus.toLowerCase().includes('complete')) {
                    currentStatusCell.classList.add('completed');
                }

                showSuccessMessage(`Order ${orderId} status updated to ${newStatus}`);
            } catch (error) {
                showErrorMessage('Error updating order status: ' + error.message);
            }
        }
        closeStatusPopup();
    });

    statusPopup = overlay;
    return statusPopup;
}

function openStatusPopup(row) {
    currentRow = row;
    const currentStatusCell = row.querySelector('.status');
    const statusSelect = document.getElementById('statusSelect');
    statusSelect.value = currentStatusCell.textContent.trim();
    statusPopup.style.display = 'flex';
}

function closeStatusPopup() {
    statusPopup.style.display = 'none';
    currentRow = null;
}

function setupOrderStatusButtons() {
    if (!statusPopup) createStatusPopup();

    document.querySelectorAll('.orders-table .btn-action').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            openStatusPopup(row);
        });
    });
}

function updateMenuItemsCount() {
  const count = document.querySelectorAll(".menu-item").length;
  document.getElementById("menuItemsCount").textContent = count;
}

function showSuccessMessage(message) {
  showNotification(message, "success");
}

function showErrorMessage(message) {
  showNotification(message, "error");
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function showTooltip(e) {
  const tooltipText = this.getAttribute("data-tooltip");
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;

  document.body.appendChild(tooltip);

  const rect = this.getBoundingClientRect();
  tooltip.style.left = `${
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2
  }px`;
  tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;

  this.tooltip = tooltip;
}

function hideTooltip() {
  if (this.tooltip) {
    this.tooltip.remove();
  }
}

function updateRelativeTimes() {
  document.querySelectorAll("[data-time]").forEach((element) => {
    const timestamp = element.getAttribute("data-time");
    element.textContent = timeago.format(new Date(timestamp));
  });

  // Update every minute
  setTimeout(updateRelativeTimes, 60000);
}
