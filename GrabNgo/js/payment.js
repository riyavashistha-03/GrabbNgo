document.addEventListener('DOMContentLoaded', function() {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    
    // Display order summary
    renderOrderSummary(cart);
    
    // Set up payment method toggles
    setupPaymentMethodToggles();
    
    // Handle form submission
    document.getElementById('paymentForm').addEventListener('submit', processPayment);
});

// Render order summary
function renderOrderSummary(cart) {
    const container = document.getElementById('orderItemsContainer');
    let subtotal = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted">Your cart is empty</p>';
        return;
    }
    
    container.innerHTML = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        container.innerHTML += `
            <div class="order-item">
                <div class="d-flex justify-content-between">
                    <span>${item.name} × ${item.quantity}</span>
                    <span class="fw-bold">₹${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    const total = subtotal;
    
    // Get elements (ensure they exist)
    const subtotalEl = document.getElementById('orderSubtotal');
    const totalEl = document.getElementById('orderTotal');
    
    // Update DOM
    if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

// Set up payment method toggles
function setupPaymentMethodToggles() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const creditCardFields = document.getElementById('creditCardFields');
    const paypalFields = document.getElementById('paypalFields');
    const cashFields = document.getElementById('cashOnDeliveryFields');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (this.value === 'credit') {
                creditCardFields.classList.remove('d-none');
                paypalFields.classList.add('d-none');
                cashFields.classList.add('d-none');
            } else if (this.value === 'paypal') {
                creditCardFields.classList.add('d-none');
                paypalFields.classList.remove('d-none');
                cashFields.classList.add('d-none');
            } else if (this.value === 'cash') {
                creditCardFields.classList.add('d-none');
                paypalFields.classList.add('d-none');
                cashFields.classList.remove('d-none');
            }
        });
    });
}

// Process payment
function processPayment(e) {
    e.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const submitBtn = document.getElementById('submitPayment');
    
    // Disable button to prevent multiple submissions
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...';
    
    // Validate credit card if selected
    if (paymentMethod === 'credit') {
        if (!validateCreditCard()) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock me-2"></i> Complete Payment';
            return;
        }
    }
    
    // Simulate payment processing (replace with actual API call)
    setTimeout(() => {
        // On successful payment
        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutCart');
        
        // Redirect to success page with order details
        const orderNumber = generateOrderNumber();
        window.location.href = `order-success.html?order=${orderNumber}`;
    }, 2000);
}

// Validate credit card fields
function validateCreditCard() {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const expiryDate = document.getElementById('expiryDate').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const cardName = document.getElementById('cardName').value.trim();
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
        alert('Please fill in all credit card details');
        return false;
    }
    
    // Simple validation for demo purposes
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        alert('Please enter a valid 16-digit card number');
        return false;
    }
    
    if (!/^\d{3,4}$/.test(cvv)) {
        alert('Please enter a valid CVV (3 or 4 digits)');
        return false;
    }
    
    return true;
}

// Generate random order number
function generateOrderNumber() {
    return 'ORD-' + Math.floor(100000 + Math.random() * 900000);
}
