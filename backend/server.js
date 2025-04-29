require('dotenv').config();
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin (like mobile apps or curl)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Serve static frontend files from GrabNgo directory
app.use(express.static(__dirname + '/../GrabNgo'));

// Serve static files from uploads directory for dish images
app.use('/uploads', express.static(__dirname + '/uploads'));

// Connect to MongoDB Atlas using Mongoose with Stable API version
const uri = process.env.MONGODB_URI;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

mongoose.connect(uri, clientOptions)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

// Routes
const authRoutes = require('./routes/auth');
const dishRoutes = require('./routes/dishes');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff');
const userRoutes = require('./routes/user');

app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/user', userRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('GrabNGo Backend API');
});

const http = require('http');

// Start server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});
