const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const authMiddleware = require('../middleware/auth');

// Get all dishes (menu)
router.get('/', async (req, res) => {
    try {
        const dishes = await Dish.find();
        res.json(dishes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new dish (staff only)
router.post('/', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { name, category, price, availability, description } = req.body;
        let imageUrl = '';

        if (req.file) {
            imageUrl = req.file.path; // Assuming file upload middleware is used
        }

        const dish = new Dish({
            name,
            category,
            price,
            availability,
            description,
            imageUrl
        });

        await dish.save();
        res.status(201).json(dish);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
