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
    addDishForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Form validation
        const dishName = document.getElementById('dishName').value.trim();
        const dishCategory = document.getElementById('dishCategory').value;
        const dishPrice = document.getElementById('dishPrice').value;
        const dishAvailability = document.getElementById('dishAvailability').value;
        
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

        // Create form data object
        const formData = {
            id: Date.now().toString(), // Generate a unique ID
            name: dishName,
            category: dishCategory,
            price: parseFloat(dishPrice),
            description: document.getElementById('dishDescription').value.trim(),
            availability: dishAvailability,
            dietaryInfo: {
                vegetarian: document.getElementById('vegetarian').checked,
                vegan: document.getElementById('vegan').checked,
                glutenFree: document.getElementById('glutenFree').checked
            }
        };

        // If image is selected, add it to formData
        if (dishImage.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                formData.image = e.target.result;
                saveDish(formData);
            };
            reader.readAsDataURL(dishImage.files[0]);
        } else {
            saveDish(formData);
        }
    });

    // Save dish to localStorage
    function saveDish(dishData) {
        try {
            // Get existing dishes from localStorage
            const existingDishes = JSON.parse(localStorage.getItem('dishes') || '[]');
            
            // Add new dish
            existingDishes.push(dishData);
            
            // Save back to localStorage
            localStorage.setItem('dishes', JSON.stringify(existingDishes));
            
            // Show success message
            showSuccess('Dish added successfully!');
            
            // Reset form
            addDishForm.reset();
            resetImagePreview(dishImage, previewImage, imagePlaceholder);
            
            // Refresh the current menu display
            refreshCurrentMenu();
        } catch (error) {
            console.error('Error saving dish:', error);
            showError('Failed to save dish. Please try again.');
        }
    }

    // Refresh current menu display
    function refreshCurrentMenu() {
        const menuItemsGrid = document.querySelector('.menu-items-grid');
        if (!menuItemsGrid) return;

        const dishes = JSON.parse(localStorage.getItem('dishes') || '[]');
        menuItemsGrid.innerHTML = '';

        dishes.forEach(dish => {
            const dishCard = createDishCard(dish);
            menuItemsGrid.appendChild(dishCard);
        });
    }

    // Create dish card for current menu
    function createDishCard(dish) {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="dish-image-container">
                    <img src="${dish.image || '../images/placeholder-image.jpg'}" class="card-img-top" alt="${dish.name}">
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
                        ${dish.dietaryInfo.vegetarian ? '<span class="badge bg-secondary">Vegetarian</span>' : ''}
                        ${dish.dietaryInfo.vegan ? '<span class="badge bg-secondary">Vegan</span>' : ''}
                        ${dish.dietaryInfo.glutenFree ? '<span class="badge bg-secondary">Gluten Free</span>' : ''}
                    </div>
                    <div class="dish-actions mt-3">
                        <button class="btn btn-sm btn-primary edit-dish-button" data-dish-id="${dish.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-dish-button" data-dish-id="${dish.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const editButton = card.querySelector('.edit-dish-button');
        const deleteButton = card.querySelector('.delete-dish-button');

        editButton.addEventListener('click', () => editDish(dish));
        deleteButton.addEventListener('click', () => deleteDish(dish.id));

        return card;
    }

    // Edit dish functionality
    function editDish(dish) {
        // Populate the edit modal with dish data
        document.getElementById('editDishName').value = dish.name;
        document.getElementById('editDishCategory').value = dish.category;
        document.getElementById('editDishPrice').value = dish.price;
        document.getElementById('editDishDescription').value = dish.description || '';
        document.getElementById('editDishAvailability').value = dish.availability;
        document.getElementById('editVegetarian').checked = dish.dietaryInfo.vegetarian;
        document.getElementById('editVegan').checked = dish.dietaryInfo.vegan;
        document.getElementById('editGlutenFree').checked = dish.dietaryInfo.glutenFree;

        // Set the current dish ID
        editDishForm.dataset.dishId = dish.id;

        // Set the current image if it exists
        if (dish.image) {
            editPreviewImage.src = dish.image;
            editPreviewImage.style.display = 'block';
            editImagePlaceholder.style.display = 'none';
        } else {
            editPreviewImage.src = '../images/placeholder-image.jpg';
            editPreviewImage.style.display = 'block';
            editImagePlaceholder.style.display = 'none';
        }

        // Show the edit modal
        editDishModal.show();
    }

    // Handle edit form submission
    saveEditDish.addEventListener('click', function() {
        const dishId = editDishForm.dataset.dishId;
        if (!dishId) return;

        // Form validation
        const dishName = document.getElementById('editDishName').value.trim();
        const dishCategory = document.getElementById('editDishCategory').value;
        const dishPrice = document.getElementById('editDishPrice').value;
        const dishAvailability = document.getElementById('editDishAvailability').value;
        
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

        try {
            // Get existing dishes
            const dishes = JSON.parse(localStorage.getItem('dishes') || '[]');
            
            // Find the dish to edit
            const dishIndex = dishes.findIndex(d => d.id === dishId);
            if (dishIndex === -1) {
                showError('Dish not found');
                return;
            }

            // Update dish data
            dishes[dishIndex] = {
                ...dishes[dishIndex],
                name: dishName,
                category: dishCategory,
                price: parseFloat(dishPrice),
                description: document.getElementById('editDishDescription').value.trim(),
                availability: dishAvailability,
                dietaryInfo: {
                    vegetarian: document.getElementById('editVegetarian').checked,
                    vegan: document.getElementById('editVegan').checked,
                    glutenFree: document.getElementById('editGlutenFree').checked
                }
            };

            // If new image is selected, update it
            if (editDishImage.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    dishes[dishIndex].image = e.target.result;
                    saveUpdatedDishes(dishes);
                };
                reader.readAsDataURL(editDishImage.files[0]);
            } else {
                saveUpdatedDishes(dishes);
            }
        } catch (error) {
            console.error('Error updating dish:', error);
            showError('Failed to update dish. Please try again.');
        }
    });

    function saveUpdatedDishes(dishes) {
        try {
            // Save updated dishes to localStorage
            localStorage.setItem('dishes', JSON.stringify(dishes));
            
            // Show success message
            showSuccess('Dish updated successfully!');
            
            // Reset and close the edit modal
            editDishForm.reset();
            editDishModal.hide();
            
            // Refresh the current menu display
            refreshCurrentMenu();
        } catch (error) {
            console.error('Error saving updated dishes:', error);
            showError('Failed to save changes. Please try again.');
        }
    }

    // Delete dish functionality
    function deleteDish(dishId) {
        if (!confirm('Are you sure you want to delete this dish?')) {
            return;
        }

        try {
            // Get existing dishes
            const dishes = JSON.parse(localStorage.getItem('dishes') || '[]');
            
            // Filter out the dish to delete
            const updatedDishes = dishes.filter(dish => dish.id !== dishId);
            
            // Save updated dishes to localStorage
            localStorage.setItem('dishes', JSON.stringify(updatedDishes));
            
            // Show success message
            showSuccess('Dish deleted successfully!');
            
            // Refresh the current menu display
            refreshCurrentMenu();
        } catch (error) {
            console.error('Error deleting dish:', error);
            showError('Failed to delete dish. Please try again.');
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
        preview.src = '../images/placeholder-image.jpg';
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