// User Menu JavaScript - Refactored for clarity and removal of redundancies
import "../css/loading-spinner.css";

function createButton(text, variant = 'primary', props = {}) {
  const button = document.createElement('button');
  button.className = `btn btn-${variant}`;
  button.textContent = text;
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      button.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      button.setAttribute(key, value);
    }
  });
  return button;
}

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const menuItemsContainer = document.querySelector(".menu-items-grid");
  const categoryButtons = document.querySelectorAll(".category-filter .btn");
  const dietaryFilters = document.querySelectorAll(".dietary-filter input");
  const cartCount = document.querySelector(".cart-count");
  const cartItemsContainer = document.querySelector(".cart-items");
  const cartTotalElement = document.getElementById("cartTotal");
  const checkoutButton = document.getElementById("checkoutButton");
  const floatingCart = document.querySelector(".floating-cart");
  const profileDropdown = document.querySelector(".profile-dropdown");
  const profileButton = document.getElementById("dropdownMenuButton");

  // Profile Elements
  const userProfileImg = document.getElementById("userProfileImg");
  const userName = document.getElementById("userName");
  const profileImgContainer = document.querySelector(".profile-img-container");
  const profilePhotoModal = new bootstrap.Modal(document.getElementById("profilePhotoModal"));
  const profilePhotoInput = document.getElementById("profilePhotoInput");
  const previewProfileImg = document.getElementById("previewProfileImg");
  const saveProfilePhotoBtn = document.getElementById("saveProfilePhotoBtn");
  const editProfileModal = new bootstrap.Modal(document.getElementById("editProfileModal"));
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileForm = document.getElementById("editProfileForm");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // State
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let menuItems = [];
  let userData = null;

  // Initialize
  fetchUserData();
  fetchMenuItems();
  updateCartCount();
  renderCartItems();

  // Event Listeners
  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      categoryButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      filterMenuItems();
    });
  });

  dietaryFilters.forEach(filter => {
    filter.addEventListener("change", filterMenuItems);
  });

  // Profile Dropdown
  if (profileButton) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      const dropdown = document.querySelector(".dropdown-menu");
      if (dropdown && dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
      }
    });
  }

  // Profile Functions
  async function fetchUserData() {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "../auth/login.html";
        return;
      }

      const response = await fetch("http://localhost:5000/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch user data");
      
      userData = await response.json();
      updateProfileDisplay();
    } catch (error) {
      console.error("Error fetching user data:", error);
      showError("Failed to load profile. Please try again later.");
    }
  }

  function updateProfileDisplay() {
    if (!userData) return;

    userName.textContent = userData.fullName || "User";
    userProfileImg.src = userData.profilePhoto || "../images/default-profile.png";
    previewProfileImg.src = userData.profilePhoto || "../images/default-profile.png";
  }

  // Profile Photo Change
  profileImgContainer.addEventListener("click", () => {
    profilePhotoModal.show();
  });

  profilePhotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        document.getElementById("photoError").textContent = "Image size should be less than 5MB";
        document.getElementById("photoError").classList.remove("d-none");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        previewProfileImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
      document.getElementById("photoError").classList.add("d-none");
    }
  });

  saveProfilePhotoBtn.addEventListener("click", async () => {
    const file = profilePhotoInput.files[0];
    if (!file) {
      document.getElementById("photoError").textContent = "Please select a photo";
      document.getElementById("photoError").classList.remove("d-none");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("profilePhoto", file);

      const response = await fetch("http://localhost:5000/api/user/profile/photo", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Failed to update profile photo");

      const data = await response.json();
      userData.profilePhoto = data.profilePhoto;
      updateProfileDisplay();
      profilePhotoModal.hide();
      showSuccess("Profile photo updated successfully");
    } catch (error) {
      console.error("Error updating profile photo:", error);
      document.getElementById("photoError").textContent = "Failed to update profile photo";
      document.getElementById("photoError").classList.remove("d-none");
    }
  });

  // Edit Profile
  editProfileBtn.addEventListener("click", () => {
    if (!userData) return;

    document.getElementById("editFullName").value = userData.fullName || "";
    document.getElementById("editEmail").value = userData.email || "";
    document.getElementById("editPhone").value = userData.phone || "";
    editProfileModal.show();
  });

  saveProfileBtn.addEventListener("click", async () => {
    const formData = {
      fullName: document.getElementById("editFullName").value,
      email: document.getElementById("editEmail").value,
      phone: document.getElementById("editPhone").value
    };

    try {
      const response = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to update profile");

      userData = { ...userData, ...formData };
      updateProfileDisplay();
      editProfileModal.hide();
      showSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      document.getElementById("profileError").textContent = "Failed to update profile";
      document.getElementById("profileError").classList.remove("d-none");
    }
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "../auth/login.html";
  });

  // Fetch menu items from backend
  async function fetchMenuItems() {
    try {
      console.log('Starting to fetch menu items...');
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/dishes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch menu items: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Menu items fetched successfully:', data);
      menuItems = data;
      renderMenuItems(menuItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      showError('Failed to load menu items. Please try again later.');
    }
  }

  // Render menu items
  function renderMenuItems(items) {
    console.log('Starting to render menu items...');
    const menuItemsGrid = document.querySelector('.menu-items-grid');
    console.log('Menu items grid element:', menuItemsGrid);
    
    if (!menuItemsGrid) {
      console.error('Menu items grid container not found');
      return;
    }

    console.log('Number of items to render:', items.length);
    menuItemsGrid.innerHTML = '';
    
    items.forEach((item, index) => {
      console.log(`Rendering item ${index + 1}:`, item);
      const itemElement = document.createElement('div');
      itemElement.className = 'menu-item';
      itemElement.dataset.category = item.category;
      itemElement.dataset.vegetarian = item.vegetarian;
      itemElement.dataset.vegan = item.vegan;
      itemElement.dataset.glutenFree = item.glutenFree;

      const imageUrl = item.imageUrl || '../images/default-dish.jpg';
      console.log(`Item ${index + 1} image URL:`, imageUrl);

      itemElement.innerHTML = `
        <div class="menu-item-img">
          <img src="${imageUrl}" alt="${item.name}" onerror="this.src='../images/default-dish.jpg'">
        </div>
        <div class="menu-item-body">
          <h3 class="menu-item-title">${item.name}</h3>
          <p class="menu-item-description">${item.description || ''}</p>
          <div class="menu-item-price">₹${item.price}</div>
          <div class="menu-item-footer">
            ${item.vegetarian ? '<span class="badge badge-veg">Veg</span>' : ''}
            ${item.vegan ? '<span class="badge badge-vegan">Vegan</span>' : ''}
            ${item.glutenFree ? '<span class="badge badge-gluten">GF</span>' : ''}
            <button class="btn btn-add-to-cart" data-id="${item._id}">
              <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      `;

      menuItemsGrid.appendChild(itemElement);
    });

    // Attach add to cart event listeners
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.id;
        const item = menuItems.find(i => i._id === itemId);
        if (item) {
          addToCart(item);
        }
      });
    });
  }

  // Filter menu items
  function filterMenuItems() {
    const activeCategory = document.querySelector(".category-filter .btn.active").dataset.category;
    const vegetarianChecked = document.getElementById("vegetarianFilter").checked;
    const veganChecked = document.getElementById("veganFilter").checked;
    const glutenFreeChecked = document.getElementById("glutenFreeFilter").checked;

    const filteredItems = menuItems.filter(item => {
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;
      const vegetarianMatch = !vegetarianChecked || item.vegetarian;
      const veganMatch = !veganChecked || item.vegan;
      const glutenFreeMatch = !glutenFreeChecked || item.glutenFree;

      return categoryMatch && vegetarianMatch && veganMatch && glutenFreeMatch;
    });

    renderMenuItems(filteredItems);
  }

  // Cart functions
  function addToCart(item) {
    const existingItem = cart.find(i => i._id === item._id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    updateCart();
    showAddToCartConfirmation(item.name);
  }

  function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
  }

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = total;
  }

  function renderCartItems() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p class='text-center'>Your cart is empty</p>";
      cartTotalElement.textContent = "0";
      return;
    }

    let total = 0;
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
        <div class="cart-item-details">
          <h5>${item.name}</h5>
          <p>₹${item.price} x ${item.quantity}</p>
        </div>
        <div class="cart-item-quantity">
          <button class="btn-quantity" onclick="updateQuantity('${item._id}', ${item.quantity - 1})">-</button>
          <span>${item.quantity}</span>
          <button class="btn-quantity" onclick="updateQuantity('${item._id}', ${item.quantity + 1})">+</button>
        </div>
      `;
      cartItemsContainer.appendChild(cartItem);
    });

    cartTotalElement.textContent = total.toFixed(2);
  }

  // Helper functions
  function showAddToCartConfirmation(itemName) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${itemName} added to cart!
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => {
      document.body.removeChild(toast);
    });
  }

  function showError(message) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => {
      document.body.removeChild(toast);
    });
  }

  function showSuccess(message) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => {
      document.body.removeChild(toast);
    });
  }

  // Global functions for cart quantity updates
  window.updateQuantity = function(itemId, newQuantity) {
    const item = cart.find(i => i._id === itemId);
    if (!item) return;

    if (newQuantity <= 0) {
      cart = cart.filter(i => i._id !== itemId);
    } else {
      item.quantity = newQuantity;
    }
    updateCart();
  };

  // Checkout button handler
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      if (cart.length === 0) {
        showError("Your cart is empty!");
        return;
      }
      // Redirect to checkout page
      window.location.href = "checkout.html";
    });
  }
});

// Render star rating HTML
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  let starsHtml = "";
  for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
  if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
  return starsHtml;
}

// Event delegation for rate buttons
document.querySelector(".menu-items-grid").addEventListener("click", function (event) {
  if (event.target.classList.contains("btn-rate")) {
    const ratingContainer = event.target.closest(".item-rating");
    if (!ratingContainer) return;
    const dishId = ratingContainer.dataset.dishId;
    openRatingModal(dishId, ratingContainer);
  }
});

// Open rating modal popup
function openRatingModal(dishId, ratingContainer) {
  const popup = document.createElement("div");
  popup.className = "rating-popup";
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
  const stars = popup.querySelectorAll(".star-rating i");
  const submitBtn = popup.querySelector(".btn-submit-rating");
  const cancelBtn = popup.querySelector(".btn-cancel-rating");

  stars.forEach(star => {
    star.addEventListener("mouseenter", () => highlightStars(stars, star.dataset.value));
    star.addEventListener("mouseleave", () => highlightStars(stars, selectedRating));
    star.addEventListener("click", () => {
      selectedRating = star.dataset.value;
      highlightStars(stars, selectedRating);
      submitBtn.disabled = false;
    });
  });

  submitBtn.addEventListener("click", async () => {
    if (selectedRating > 0) {
      try {
        const response = await fetch(`http://localhost:5000/api/dishes/${dishId}/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("authToken"),
          },
          body: JSON.stringify({ rating: Number(selectedRating) }),
        });
        if (!response.ok) throw new Error("Failed to submit rating");
        const data = await response.json();
        ratingContainer.querySelector(".average-rating").textContent = data.averageRating.toFixed(1);
        ratingContainer.querySelector(".stars").innerHTML = renderStars(data.averageRating);
        alert("Rating submitted successfully");
        document.body.removeChild(popup);
      } catch (error) {
        alert("Error submitting rating: " + error.message);
      }
    }
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(popup);
  });
}

// Highlight stars in rating modal
function highlightStars(stars, count) {
  stars.forEach(star => {
    if (star.dataset.value <= count) {
      star.classList.remove("far");
      star.classList.add("fas");
    } else {
      star.classList.remove("fas");
      star.classList.add("far");
    }
  });
}
