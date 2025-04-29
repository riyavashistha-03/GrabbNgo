document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dishImage = document.getElementById('dishImage');
    const previewImage = document.getElementById('previewImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const removeImage = document.getElementById('removeImage');
    const addDishForm = document.getElementById('addDishForm');
    const resetButton = addDishForm.querySelector('button[type="reset"]');
    
    // Edit Modal Elements
    const editDishModal = new bootstrap.Modal(document.getElementById('editDishModal'));
    const editDishForm = document.getElementById('editDishForm');
    const editDishImage = document.getElementById('editDishImage');
    const editPreviewImage = document.getElementById('editPreviewImage');
    const editImagePlaceholder = document.getElementById('editImagePlaceholder');
    const editRemoveImage = document.getElementById('editRemoveImage');
    const saveEditDish = document.getElementById('saveEditDish');

    // Initialize the current menu display
    refreshCurrentMenu();

    // Image preview functionality
    dishImage.addEventListener('change', function() {
        handleImagePreview(this, previewImage, imagePlaceholder);
    });
    
    // Edit modal image preview functionality
    editDishImage.addEventListener('change', function() {
        handleImagePreview(this, editPreviewImage, editImagePlaceholder);
    });
    
    // Remove image functionality
    removeImage.addEventListener('click', function() {
        resetImagePreview(dishImage, previewImage, imagePlaceholder);
    });

    // Edit modal remove image functionality
    editRemoveImage.addEventListener('click', function() {
        resetImagePreview(editDishImage, editPreviewImage, editImagePlaceholder);
    });

    // Reset form functionality
    resetButton.addEventListener('click', function() {
        resetImagePreview(dishImage, previewImage, imagePlaceholder);
    });
    
    // Form submission
    addDishForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Form validation
        const dishName = document.getElementById('dishName').value.trim();
        const dishCategory = document.getElementById('dishCategory').value;
        const dishPrice = document.getElementById('dishPrice').value;
        const dishAvailability = document.getElementById('dishAvailability').value;
        const dishDescription = document.getElementById('dishDescription').value.trim();
        const vegetarian = document.getElementById('vegetarian').checked;
        const vegan = document.getElementById('vegan').checked;
        const glutenFree = document.getElementById('glutenFree').checked;
        const imageFile = dishImage.files[0];
        
        if (!dishName) {
            showError('Please enter a dish name');
            return;
        }
        if (!dishCategory) {
            showError('Please select a category');
            return;
        }
        if (!dishPrice || parseFloat(dishPrice) <= 0) {
            showError('Please enter a valid price');
            return;
        }

        // Create form data object for backend
        const formData = new FormData();
        formData.append('name', dishName);
        formData.append('category', dishCategory);
        formData.append('price', parseFloat(dishPrice));
        formData.append('availability', dishAvailability);
        formData.append('description', dishDescription);
        formData.append('vegetarian', vegetarian);
        formData.append('vegan', vegan);
        formData.append('glutenFree', glutenFree);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        await saveDishToBackend(formData);
    });

    // Save dish to backend API
    async function saveDishToBackend(formData) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showError('Authentication error. Please log in again.');
                // Optionally redirect to login
                // window.location.href = '../login.html'; 
                return;
            }

            // Add loading indicator if desired
            // showLoadingIndicator();

            const response = await fetch('http://localhost:5000/api/dishes', {
                method: 'POST',
                headers: {
                    // Content-Type is set automatically by browser for FormData
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            // Remove loading indicator
            // hideLoadingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const newDish = await response.json();
            console.log('Dish added successfully via API:', newDish);

            showSuccess('Dish added successfully!');
            
            addDishForm.reset();
            resetImagePreview(dishImage, previewImage, imagePlaceholder);
            
            refreshCurrentMenu(); // Refresh using data from backend now

        } catch (error) {
            console.error('Error saving dish to backend:', error);
            showError(`Failed to save dish: ${error.message}`);
            // hideLoadingIndicator();
        }
    }

    // Refresh current menu display (fetch from backend)
    async function refreshCurrentMenu() {
        const menuItemsGrid = document.querySelector('.menu-items-grid');
        if (!menuItemsGrid) return;

        try {
            const token = localStorage.getItem('authToken');
            // Fetch dishes from the backend API
            const response = await fetch('http://localhost:5000/api/dishes', {
                 headers: {
                    'Authorization': `Bearer ${token}`
                 }
            });
            if (!response.ok) {
                 throw new Error('Failed to fetch dishes');
            }
            const dishes = await response.json();

            menuItemsGrid.innerHTML = '';
            dishes.forEach(dish => {
                const dishCard = createDishCard(dish);
                menuItemsGrid.appendChild(dishCard);
            });
        } catch (error) {
            console.error('Error refreshing menu:', error);
            showError('Could not load menu items.');
        }
    }

    // Create dish card for current menu
    function createDishCard(dish) {
        const card = document.createElement('div');
        const dishId = dish._id; 
        card.className = 'col-md-4 mb-4'; 
        // Use existing default image as fallback
        const fallbackImageUrl = '../images/default-profile.png'; // Changed to existing file
        const imageUrl = dish.imageUrl ? `http://localhost:5000/${dish.imageUrl.replace(/\\/g, '/')}` : fallbackImageUrl;
        card.innerHTML = `
            <div class="card h-100">
                <div class="dish-image-container">
                    <img src="${imageUrl}" class="card-img-top" alt="${dish.name}" onerror="this.onerror=null; this.src='${fallbackImageUrl}';">
                </div>
                <div class="card-body">
                    <h5 class="card-title">${dish.name}</h5>
                    <p class="card-text">${dish.description || 'No description available'}</p>
                    <div class="dish-details">
                        <span class="badge bg-primary">₹${dish.price}</span>
                        <span class="badge bg-${dish.availability === 'available' ? 'success' : 'danger'}">${dish.availability}</span>
                        <span class="badge bg-info">${dish.category}</span>
                    </div>
                    <div class="dietary-tags mt-2">
                        ${dish.vegetarian ? '<span class="badge bg-secondary">Vegetarian</span>' : ''}
                        ${dish.vegan ? '<span class="badge bg-secondary">Vegan</span>' : ''}
                        ${dish.glutenFree ? '<span class="badge bg-secondary">Gluten Free</span>' : ''}
                    </div>
                    <div class="dish-actions mt-3">
                        <button class="btn btn-sm btn-primary edit-dish-button" data-dish-id="${dishId}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-dish-button" data-dish-id="${dishId}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        const editButton = card.querySelector('.edit-dish-button');
        const deleteButton = card.querySelector('.delete-dish-button');

        editButton.addEventListener('click', () => editDish(dish));
        deleteButton.addEventListener('click', () => deleteDish(dishId));

        return card;
    }

    // Edit dish functionality (Needs update to use backend API)
    function editDish(dish) {
        // Populate the edit modal with dish data (using dish._id)
        document.getElementById('editDishName').value = dish.name;
        document.getElementById('editDishCategory').value = dish.category;
        document.getElementById('editDishPrice').value = dish.price;
        document.getElementById('editDishDescription').value = dish.description || '';
        document.getElementById('editDishAvailability').value = dish.availability;
        document.getElementById('editVegetarian').checked = dish.vegetarian; // Directly use boolean
        document.getElementById('editVegan').checked = dish.vegan; // Directly use boolean
        document.getElementById('editGlutenFree').checked = dish.glutenFree; // Directly use boolean

        editDishForm.dataset.dishId = dish._id; // Use MongoDB _id

        const imageUrl = dish.imageUrl ? `http://localhost:5000/${dish.imageUrl.replace(/\\/g, '/')}` : '../images/placeholder-image.jpg';
        editPreviewImage.src = imageUrl;
        editPreviewImage.style.display = 'block';
        editImagePlaceholder.style.display = 'none';

        editDishModal.show();
    }

    // Handle edit form submission (Needs update to use backend API)
    saveEditDish.addEventListener('click', async function() {
        const dishId = editDishForm.dataset.dishId;
        if (!dishId) return;

        const dishName = document.getElementById('editDishName').value.trim();
        const dishCategory = document.getElementById('editDishCategory').value;
        const dishPrice = document.getElementById('editDishPrice').value;
        const dishAvailability = document.getElementById('editDishAvailability').value;
        const dishDescription = document.getElementById('editDishDescription').value.trim();
        const vegetarian = document.getElementById('editVegetarian').checked;
        const vegan = document.getElementById('editVegan').checked;
        const glutenFree = document.getElementById('editGlutenFree').checked;
        const imageFile = editDishImage.files[0];

        if (!dishName || !dishCategory || !dishPrice || parseFloat(dishPrice) <= 0) {
            showError('Please fill in all required fields correctly');
            return;
        }

        const formData = new FormData();
        formData.append('name', dishName);
        formData.append('category', dishCategory);
        formData.append('price', parseFloat(dishPrice));
        formData.append('availability', dishAvailability);
        formData.append('description', dishDescription);
        formData.append('vegetarian', vegetarian);
        formData.append('vegan', vegan);
        formData.append('glutenFree', glutenFree);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/dishes/${dishId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showSuccess('Dish updated successfully!');
            editDishModal.hide();
            refreshCurrentMenu();
        } catch (error) {
            console.error('Error updating dish:', error);
            showError(`Failed to update dish: ${error.message}`);
        }
    });

    // Delete dish functionality (Needs update to use backend API)
    async function deleteDish(dishId) {
        if (!confirm('Are you sure you want to delete this dish?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/dishes/${dishId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            showSuccess('Dish deleted successfully!');
            refreshCurrentMenu();
        } catch (error) {
            console.error('Error deleting dish:', error);
            showError(`Failed to delete dish: ${error.message}`);
        }
    }

    // Helper functions
    function handleImagePreview(input, preview, placeholder) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function resetImagePreview(input, preview, placeholder) {
        input.value = '';
        preview.src = '../images/default-profile.png'; // Changed to existing file
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    }

    function showError(message) {
        alert(message);
    }

    function showSuccess(message) {
        alert(message);
    }
}); 