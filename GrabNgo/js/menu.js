// User Menu JavaScript - Refactored for clarity and removal of redundancies
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const menuItemsContainer = document.querySelector(".menu-items-grid");
  const categoryFilters = document.querySelectorAll(".categories li");
  const checkboxes = document.querySelectorAll(".filter-option input");
  const sortSelect = document.getElementById("sortBy");
  const searchInput = document.querySelector(".search-box input");
  const searchButton = document.querySelector(".search-box button");
  const cartCount = document.querySelector(".cart-count");
  const cartItemsContainer = document.querySelector(".cart-items");
  const subtotalElement = document.querySelector(".subtotal");
  const taxElement = document.querySelector(".tax");
  const totalElement = document.querySelector(".total-amount");
  const checkoutButton = document.querySelector(".btn-checkout");
  const cartSidebar = document.querySelector(".cart-sidebar");
  const cartOverlay = document.querySelector(".cart-overlay");
  const closeCartButton = document.querySelector(".btn-close-cart");
  const cartLink = document.querySelector('a[href="#"]'); // Update selector if needed
  const canteenRadios = document.querySelectorAll('input[name="canteen"]');

  // Cart state
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let selectedCanteen = "A block";

  // Initialize page
  fetchMenuItems();
  updateCartCount();
  renderCartItems();

  // Event Listeners
  categoryFilters.forEach(filter => {
    filter.addEventListener("click", () => {
      categoryFilters.forEach(f => f.classList.remove("active"));
      filter.classList.add("active");
      filterMenuItems();
    });
  });

  checkboxes.forEach(checkbox => checkbox.addEventListener("change", filterMenuItems));
  sortSelect.addEventListener("change", sortMenuItems);
  searchButton.addEventListener("click", searchMenuItems);
  searchInput.addEventListener("keyup", e => { if (e.key === "Enter") searchMenuItems(); });

  if (cartLink) cartLink.addEventListener("click", e => { e.preventDefault(); openCart(); });
  if (closeCartButton) closeCartButton.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      localStorage.setItem("checkoutCart", JSON.stringify(cart));
      window.location.href = "payment.html";
    });
  }

  canteenRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      selectedCanteen = radio.value;
      filterMenuItems();
    });
  });

  // Fetch menu items from backend
  async function fetchMenuItems() {
    try {
      const response = await fetch("http://localhost:5000/api/dishes");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const menuItems = await response.json();
      renderMenuItems(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }

  // Render menu items and attach add to cart listeners
  function renderMenuItems(menuItems) {
    if (!menuItemsContainer) return;
    menuItemsContainer.innerHTML = "";
    menuItems.forEach(item => {
      if (item.price == null) {
        console.warn(`Dish ${item.name} missing price, skipping.`);
        return;
      }
      const itemElement = document.createElement("div");
      itemElement.className = "menu-item";
      itemElement.dataset.id = item._id || item.id;
      itemElement.dataset.category = item.category || "";
      itemElement.dataset.vegetarian = item.vegetarian ? "true" : "false";
      itemElement.dataset.canteen = item.canteen || "A block";

      let imageUrl = item.imageUrl || "../images/default-dish.jpg";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `http://localhost:5000/${imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl}`;
      }

      itemElement.innerHTML = `
        <div class="item-image">
          <img src="${imageUrl}" alt="${item.name}" />
        </div>
        <div class="item-details">
          <h3>${item.name}</h3>
          <p class="item-description">${item.description || ""}</p>
          <p class="item-price">₹${item.price.toFixed(2)}</p>
          <div class="item-rating" data-dish-id="${item._id}">
            <span class="average-rating">${item.averageRating ? item.averageRating.toFixed(1) : "0.0"}</span>
            <span class="stars">${renderStars(item.averageRating)}</span>
            <button class="btn btn-rate">Rate</button>
          </div>
          <button class="btn btn-add-to-cart">Add to Cart</button>
        </div>
      `;
      menuItemsContainer.appendChild(itemElement);
    });
    attachAddToCartListeners();
  }

  // Attach event listeners to all add to cart buttons
  function attachAddToCartListeners() {
    menuItemsContainer.querySelectorAll(".btn-add-to-cart").forEach(button => {
      button.addEventListener("click", () => {
        const menuItem = button.closest(".menu-item");
        addToCart(menuItem);
      });
    });
  }

  // Filter menu items based on category, vegetarian, and canteen
  function filterMenuItems() {
    const activeCategory = document.querySelector(".categories li.active")?.dataset.category || "all";
    const vegetarianChecked = document.getElementById("vegetarian")?.checked || false;

    document.querySelectorAll(".menu-item").forEach(item => {
      const categoryMatch = activeCategory === "all" || item.dataset.category === activeCategory;
      const vegetarianMatch = !vegetarianChecked || item.dataset.vegetarian === "true";
      const canteenMatch = item.dataset.canteen === selectedCanteen;

      item.style.display = (categoryMatch && vegetarianMatch && canteenMatch) ? "flex" : "none";
    });
  }

  // Sort menu items by selected criteria
  function sortMenuItems() {
    const sortValue = sortSelect.value;
    const items = Array.from(document.querySelectorAll(".menu-item"));
    const menuContainer = menuItemsContainer;

    items.sort((a, b) => {
      switch (sortValue) {
        case "price-asc":
          return parsePrice(a) - parsePrice(b);
        case "price-desc":
          return parsePrice(b) - parsePrice(a);
        case "name":
          return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent);
        case "popular":
        default:
          return 0;
      }
    });

    items.forEach(item => menuContainer.appendChild(item));
  }

  // Helper to parse price from menu item element
  function parsePrice(item) {
    return parseFloat(item.querySelector(".item-price").textContent.replace("₹", "")) || 0;
  }

  // Search menu items by name or description
  function searchMenuItems() {
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll(".menu-item").forEach(item => {
      const name = item.querySelector("h3").textContent.toLowerCase();
      const desc = item.querySelector(".item-description").textContent.toLowerCase();
      item.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? "flex" : "none";
    });
  }

  // Add item to cart or increase quantity if already present
  function addToCart(menuItem) {
    const id = menuItem.dataset.id;
    const name = menuItem.querySelector("h3").textContent;
    const price = parseFloat(menuItem.querySelector(".item-price").textContent.replace("₹", ""));
    const image = menuItem.querySelector(".item-image img").src;

    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id, name, price, image, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showAddToCartConfirmation(name);
  }

  // Update cart item count display
  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = total;
  }

  // Render cart items in sidebar
  function renderCartItems() {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
        </div>`;
      subtotalElement.textContent = "₹0.00";
      taxElement.textContent = "₹0.00";
      totalElement.textContent = "₹0.00";
      return;
    }

    let subtotal = 0;
    let cartHTML = "";

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
        </div>`;
    });

    // Tax removed as per user request
    const total = subtotal;

    cartItemsContainer.innerHTML = cartHTML;
    subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    taxElement.textContent = `₹0.00`;
    totalElement.textContent = `₹${total.toFixed(2)}`;

    // Attach cart item buttons event listeners
    cartItemsContainer.querySelectorAll(".btn-remove").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.closest(".cart-item").dataset.id;
        removeFromCart(id);
      });
    });

    cartItemsContainer.querySelectorAll(".btn-decrease").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.closest(".cart-item").dataset.id;
        updateCartItemQuantity(id, -1);
      });
    });

    cartItemsContainer.querySelectorAll(".btn-increase").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.closest(".cart-item").dataset.id;
        updateCartItemQuantity(id, 1);
      });
    });
  }

  // Remove item from cart
  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
  }

  // Update quantity of cart item
  function updateCartItemQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      renderCartItems();
    }
  }

  // Show confirmation popup when item added to cart
  function showAddToCartConfirmation(name) {
    const confirmation = document.createElement("div");
    confirmation.className = "add-to-cart-confirmation";
    confirmation.textContent = `Added ${name} to cart`;
    document.body.appendChild(confirmation);

    setTimeout(() => confirmation.classList.add("show"), 10);
    setTimeout(() => {
      confirmation.classList.remove("show");
      setTimeout(() => confirmation.remove(), 300);
    }, 2000);
  }

  // Open cart sidebar
  function openCart() {
    cartSidebar.classList.add("open");
    cartOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  // Close cart sidebar
  function closeCart() {
    cartSidebar.classList.remove("open");
    cartOverlay.classList.remove("open");
    document.body.style.overflow = "";
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
