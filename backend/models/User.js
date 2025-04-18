const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: ['user', 'staff'],
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: function() { return this.userType === 'user'; }, unique: true, sparse: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    staffCode: { type: String, required: function() { return this.userType === 'staff'; } },
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
