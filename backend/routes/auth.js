const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup route
router.post('/signup/:userType', async (req, res) => {
    const { userType } = req.params;
    const { name, email, mobile, password, staffCode } = req.body;

    if (!['user', 'staff'].includes(userType)) {
        return res.status(400).json({ message: 'Invalid user type' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }

        if (userType === 'staff' && staffCode !== 'STAFF123') {
            return res.status(400).json({ message: 'Invalid staff verification code' });
        }

        const user = new User({
            userType,
            name,
            email: userType === 'user' ? email : undefined,
            mobile,
            password,
            staffCode: userType === 'staff' ? staffCode : undefined
        });

        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { userType, mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile, userType });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, userType: user.userType }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, userType: user.userType, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Password recovery route (simplified)
router.post('/password-recovery/:userType', async (req, res) => {
    const { userType } = req.params;
    const { mobile, email } = req.body;

    try {
        const user = await User.findOne({ mobile, userType });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // In real app, send email or SMS with reset instructions
        res.json({ message: 'Password reset instructions sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
