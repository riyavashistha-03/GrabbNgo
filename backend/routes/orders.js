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

        res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

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

        res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update order status
router.put('/:orderId/status', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Forbidden: Staff only' });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        console.log(`Updating order ${orderId} status to ${status}`);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

module.exports = router;
