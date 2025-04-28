// Staff Dashboard JavaScript - Updated for Bootstrap 5 integration

document.addEventListener("DOMContentLoaded", function () {
  // Load staff name from localStorage or default
  const staffNameElement = document.getElementById("staffName");
  if (staffNameElement) {
    const staffName = localStorage.getItem("staffName") || "Admin";
    staffNameElement.textContent = staffName;
  }

  // Fetch and render popular dishes dynamically
  fetchAndRenderPopularDishes();

  // Fetch and render current menu items on add-dish page
  fetchAndRenderMenuItems();

  // Setup edit and delete buttons for menu items
  setupMenuItemActions();

  // Setup add dish form submission handler
  const addDishForm = document.getElementById("addDishForm");
  if (addDishForm) {
    addDishForm.addEventListener("submit", async (event) => {
      event.preventDefault();

<<<<<<< HEAD
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
=======
      const name = document.getElementById("dishName").value.trim();
      const price = parseFloat(document.getElementById("dishPrice").value);
      const description = document.getElementById("dishDescription").value.trim();
      const category = document.getElementById("dishCategory").value;
      const availability = document.getElementById("available").checked ? "available" : "unavailable";
      const imageInput = document.getElementById("dishImage");
      const imageFile = imageInput.files[0];

      if (!name || isNaN(price) || !category) {
        alert("Please fill in all required fields correctly.");
        return;
      }
>>>>>>> 2d19e147c772ec1df34145e58de579858ca3e1e9

      const formData = new FormData();
<<<<<<< HEAD
      formData.append("name", dishName);
      formData.append("category", dishCategory);
      formData.append("price", dishPrice);
      formData.append("availability", dishAvailability);
      formData.append("description", dishDescription);
      formData.append("vegetarian", vegetarian);
      formData.append("nonveg", nonveg);

      if (dishImageInput.files.length > 0) {
        formData.append("image", dishImageInput.files[0]);
=======
      formData.append("name", name);
      formData.append("price", price);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("availability", availability);
      if (imageFile) {
        formData.append("image", imageFile);
>>>>>>> 2d19e147c772ec1df34145e58de579858ca3e1e9
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
        fetchAndRenderMenuItems();
      } catch (error) {
        alert("Error adding dish: " + error.message);
      }
    });
  }

  // Setup Bootstrap modal triggers if needed
  // Example: Using Bootstrap 5 modal API for edit dish modal
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

    // Assuming Bootstrap modal with id 'editDishModal' exists
    const editModalEl = document.getElementById("editDishModal");
    if (!editModalEl) {
      alert("Edit modal not implemented");
      return;
    }

    // Populate modal fields with dish data
    editModalEl.querySelector("#editDishName").value = dish.name || "";
    editModalEl.querySelector("#editDishPrice").value = dish.price || "";
    editModalEl.querySelector("#editDishCategory").value = dish.category || "";
    editModalEl.querySelector("#editDishAvailability").value = dish.availability || "available";
    editModalEl.querySelector("#editDishDescription").value = dish.description || "";

    // Show modal using Bootstrap Modal API
    const bootstrapModal = new bootstrap.Modal(editModalEl);
    bootstrapModal.show();

    // Setup save button handler
    const saveButton = editModalEl.querySelector(".btn-save");
    saveButton.onclick = async () => {
      const updatedDish = {
        name: editModalEl.querySelector("#editDishName").value,
        price: parseFloat(editModalEl.querySelector("#editDishPrice").value),
        category: editModalEl.querySelector("#editDishCategory").value,
        availability: editModalEl.querySelector("#editDishAvailability").value,
        description: editModalEl.querySelector("#editDishDescription").value,
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
        bootstrapModal.hide();
        fetchAndRenderMenuItems(); // Refresh menu items
      } catch (error) {
        alert("Error updating dish: " + error.message);
      }
    };

    // Setup cancel button handler
    const cancelButton = editModalEl.querySelector(".btn-cancel");
    cancelButton.onclick = () => {
      bootstrapModal.hide();
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
      dishCard.className = "dish-card col";
      dishCard.innerHTML = `
                <div class="card h-100">
                  <img src="../images/dish-placeholder.jpg" class="card-img-top" alt="${dish.name}">
                  <div class="card-body">
                    <h5 class="card-title">${dish.name}</h5>
                    <p class="card-text">${dish.totalQuantity} orders this week</p>
                  </div>
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
      menuItem.className = "menu-item card mb-3";
      menuItem.dataset.id = dish._id;
      const imageUrl = dish.imageUrl ? `http://localhost:5000/${dish.imageUrl}` : "../images/dish-placeholder.jpg";
      menuItem.innerHTML = `
                <div class="row g-0">
                  <div class="col-md-4">
                    <img src="${imageUrl}" class="img-fluid rounded-start" alt="${dish.name}">
                  </div>
                  <div class="col-md-8">
                    <div class="card-body">
                      <h5 class="card-title">${dish.name}</h5>
                      <p class="card-text text-muted">${dish.category}</p>
                      <p class="card-text fw-bold">${formatCurrency(dish.price)}</p>
                      <div class="btn-group" role="group" aria-label="Menu item actions">
                        <button type="button" class="btn btn-warning btn-edit"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn btn-danger btn-delete"><i class="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
            `;
      menuGrid.appendChild(menuItem);
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
  }
}
