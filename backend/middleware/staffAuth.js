const jwt = require('jsonwebtoken');
// const Staff = require('../models/Staff'); // Use User model instead
const User = require('../models/User');

const staffAuth = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization denied, no token provided or invalid format' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authorization denied, token missing after Bearer' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token payload
        const user = await User.findById(decoded.id).select('-password'); // Exclude password

        if (!user) {
            return res.status(401).json({ message: 'Authorization denied, user not found' });
        }

        // Check if the user is actually staff
        if (user.userType !== 'staff') {
            return res.status(403).json({ message: 'Forbidden: Access denied. Staff privileges required.' });
        }

        // Attach staff user info to the request object
        req.user = user; // Attach the verified staff user to req.user
        // req.staff = user; // Or use req.staff if preferred consistently elsewhere
        next(); // Pass control to the next middleware or route handler

    } catch (error) {
        console.error('Staff authentication error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Authorization denied, invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Authorization denied, token expired' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = staffAuth; 