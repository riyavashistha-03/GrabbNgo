const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const authMiddleware = require('../middleware/auth');
const staffAuth = require('../middleware/staffAuth');

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

// Update order status (Staff only)
router.put('/:orderId/status', staffAuth, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Optional: Add validation for allowed status values
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing status' });
    }

    try {
        console.log(`Staff member ${req.user.id} updating order ${orderId} status to ${status}`);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        let orders;
        if (req.user.userType === 'staff') {
            orders = await Order.find().populate('user', 'name').populate('items.dish');
        } else {
            orders = await Order.find({ user: req.user.id }).populate('user', 'name').populate('items.dish');
        }

        // Filter out orders with null user to avoid errors
        orders = orders.filter(order => order.user !== null);

        // Format orders for frontend
        const formattedOrders = orders.map(order => ({
            id: order._id,
            customerName: order.user.name,
            items: order.items.map(item => ({
                dishName: item.dish ? item.dish.name : 'Unknown Dish',
                quantity: item.quantity,
                price: item.dish ? item.dish.price : 0
            })),
            totalAmount: order.totalPrice,
            status: order.status || 'pending',
            date: order.createdAt
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
