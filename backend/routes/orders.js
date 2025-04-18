const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const authMiddleware = require('../middleware/auth');

// Place a new order
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order items are required' });
        }

        // Calculate total price
        let totalPrice = 0;
        for (const item of items) {
            const dish = await Dish.findById(item.id);
            if (!dish) {
                return res.status(400).json({ message: `Dish not found: ${item.id}` });
            }
            totalPrice += dish.price * item.quantity;
        }

        const orderItems = items.map(item => ({
            dish: item.id,
            quantity: item.quantity
        }));

        const order = new Order({
            user: userId,
            items: orderItems,
            totalPrice
        });

        await order.save();

        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
