const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    availability: { type: String, default: 'available' },
    description: { type: String },
    imageUrl: { type: String },
    vegetarian: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
