const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
        rquired: true
    },
    email: {
        type: String,
        trim: true,
        rquired: true,
        unique: true
    },
    password: {
        type: String,
        trim: true,
        rquired: true,
        min: 6,
        max: 64
    },
    stripe_customer_id: String,
    subscriptions: []
});

module.exports = model('User', userSchema);