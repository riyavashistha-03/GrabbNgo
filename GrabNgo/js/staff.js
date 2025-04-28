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
      const nonveg = document.getElementById("nonveg").checked;

      // Prepare form data for image upload if needed
      const formData = new FormData();
      formData.append("name", dishName);
      formData.append("category", dishCategory);
      formData.append("price", dishPrice);
      formData.append("availability", dishAvailability);
      formData.append("description", dishDescription);
      formData.append("vegetarian", vegetarian);
      formData.append("nonveg", nonveg);

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
        fetchAndRenderMenuItems();
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

  // Fetch and render popular dishes dynamically
  fetchAndRenderPopularDishes();

  // Setup quick add dish modal
  setupQuickAddDish();

  // Setup order status buttons
  // setupOrderStatusButtons();

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
          const response = await fetch(`http://localhost:5000/api/dishes/${dishId}`, {
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
        const updateResponse = await fetch(`http://localhost:5000/api/dishes/${dishId}`, {
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
      const imageUrl = dish.imageUrl ? `http://localhost:5000/${dish.imageUrl}` : "../images/dish-placeholder.jpg";
      menuItem.innerHTML = `
                <div class="item-image">
                    <img src="${imageUrl}" alt="${dish.name}">
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

// Other functions like setupOrderStatusButtons, showNotification, etc. remain unchanged
