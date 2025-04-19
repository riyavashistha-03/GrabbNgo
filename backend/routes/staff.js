const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get staff dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const menuItemsCount = await Dish.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
        const activeUsers = await User.countDocuments({ userType: 'user' });
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

// Get recent orders with user names
router.get('/orders', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name')
            .populate('items.dish', 'name price');

        res.json(recentOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get business reports
router.get('/reports', authMiddleware, async (req, res) => {
    if (req.user.userType !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const totalOrders = await Order.countDocuments();
        const totalRevenueAgg = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].totalRevenue : 0;

        const popularDishesAgg = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.dish", totalQuantity: { $sum: "$items.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "dishes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "dishDetails"
                }
            },
            { $unwind: "$dishDetails" },
            {
                $project: {
                    _id: 0,
                    dishId: "$dishDetails._id",
                    name: "$dishDetails.name",
                    totalQuantity: 1
                }
            }
        ]);

        res.json({
            totalOrders,
            totalRevenue,
            popularDishes: popularDishesAgg
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

