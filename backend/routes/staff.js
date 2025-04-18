const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// Get staff dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const menuItemsCount = await require('../models/Dish').countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
        const activeUsers = await require('../models/User').countDocuments({ userType: 'user' });
        const ordersToday = await Order.find({ createdAt: { $gte: today } });
        const todayRevenue = ordersToday.reduce((sum, order) => sum + order.totalPrice, 0);

        res.json({
            menuItems: menuItemsCount,
            todayOrders,
            activeUsers,
            todayRevenue
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
