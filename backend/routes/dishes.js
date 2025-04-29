const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists or create it
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get all dishes (menu)
router.get('/', async (req, res) => {
    try {
        let dishes = await Dish.find();

        // Normalize imageUrl for each dish
        dishes = dishes.map(dish => {
            if (dish.imageUrl) {
                let normalizedPath = dish.imageUrl.replace(/\\/g, '/');
                if (!normalizedPath.startsWith('uploads/')) {
                    normalizedPath = path.posix.join('uploads', path.basename(normalizedPath));
                }
                dish.imageUrl = normalizedPath;
            }
            return dish;
        });

        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get dish by ID
const mongoose = require('mongoose');

router.get('/:id', async (req, res) => {
    try {
        const dishId = req.params.id;
        console.log(`GET /api/dishes/${dishId} requested`);

        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return res.status(400).json({ message: 'Invalid dish ID' });
        }

        const dish = await Dish.findById(dishId);
        if (!dish) {
            console.log(`Dish with id ${dishId} not found`);
            return res.status(404).json({ message: 'Dish not found' });
        }
        res.json(dish);
    } catch (error) {
        console.error(`Error fetching dish with id ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new dish (staff only)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        const { name, category, price, availability, description, vegetarian, vegan, glutenFree } = req.body;
        let imageUrl = '';

        if (req.file) {
            imageUrl = req.file.path; // Path to uploaded image
        }

        const dish = new Dish({
            name,
            category,
            price: Number(price),
            availability,
            description,
            vegetarian: vegetarian === 'true' || vegetarian === true,
            vegan: vegan === 'true' || vegan === true,
            glutenFree: glutenFree === 'true' || glutenFree === true,
            imageUrl
        });

        await dish.save();
        res.status(201).json(dish);
    } catch (error) {
        console.error('Error adding dish:', error);
        console.error(error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update dish (staff only)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dishId = req.params.id;
        const updateData = req.body;

        if (req.file) {
            updateData.imageUrl = req.file.path; // Path to uploaded image
        }

        const updatedDish = await Dish.findByIdAndUpdate(dishId, updateData, { new: true });

        if (!updatedDish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        res.json(updatedDish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete dish (staff only)
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dishId = req.params.id;
        const deletedDish = await Dish.findByIdAndDelete(dishId);

        if (!deletedDish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add rating to dish (user only)
router.post('/:id/rate', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'user') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const dishId = req.params.id;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const dish = await Dish.findById(dishId);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        // Calculate new average rating
        const totalRating = dish.averageRating * dish.ratingCount;
        const newRatingCount = dish.ratingCount + 1;
        const newAverageRating = (totalRating + rating) / newRatingCount;

        dish.averageRating = newAverageRating;
        dish.ratingCount = newRatingCount;

        await dish.save();

        res.json({ message: 'Rating submitted successfully', averageRating: dish.averageRating, ratingCount: dish.ratingCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
