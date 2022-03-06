const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth'); 

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name) return res.json({ error: 'Name is required!' });
        if (!password || password.length < 6) return res.json({ 
            error: 'Password is required! and should at least 6 characters long!' 
        });

        const exist = await User.findOne({ email });
       
        if (exist) return res.json({ error: 'Email is taken!' });

        // hash password
        const hashedPassword = await hashPassword(password);

        // create account in stripe
        const customer = await stripe.customers.create({
            email,
        });

        try {
            const user = await new User({
                name,
                email,
                password: hashedPassword,
                stripe_customer_id: customer.id
            });

            user.save();
            const { password, ...rest } = user._doc;

            return res.json({ user: rest });
        } catch (err) {
            console.log(err);
        }

    } catch (err) {
        console.log(err);
    }
};

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).select('-__v');
       
        if (!user) return res.json({ error: 'No User found or the entered password is incorrect!' });

        const match = await comparePassword(req.body.password, user.password);

        if (!match) return res.json({ error: 'No User found or the entered password is incorrect!' });

        // Create signed token
        const token = jwt.sign(
            { _id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: "77d" }
        );
        
        const { password, ...rest } = user._doc;

        res.json({
            token,
            user: rest
        });

    } catch (err) { 
        console.log(err);
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    const response  = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { email_verified, name, email } = response.payload;

    if (email_verified) {
        try {
            let user = await User.findOne({ email });

            // If the entered email has already been registered
            if (user) {
                const token = jwt.sign(
                    { _id: user._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: "77d" }
                );
                
                const { password, ...rest } = user._doc;
                    return res.json({
                        token,
                        user: rest
                    });
                }
                
            let passwordGeneration = email + process.env.JWT_SECRET;
            const hashedPassword = await hashPassword(passwordGeneration);
            const customer = await stripe.customers.create({ email });    
            user = await new User({
                name,
                email,
                password: hashedPassword,
                stripe_customer_id: customer.id
            });
            user.save();  

            const token = jwt.sign(
                { _id: user._id }, 
                process.env.JWT_SECRET,
                { expiresIn: "77d" }
            );
            const { password, ...rest } = user._doc;                
            return res.status(200).json({
                token,
                user: rest
            }); 
        } catch (err) {
            res.status(400).json({
                    error: 'Sign up with Google failed!'
            });
        }
    } else {
        return res.status(400).json({
            error: 'Google login failed. Try again'
        });
    }
};

exports.facebookLogin = async (req, res) => {
    const { name, email } = req.body;

    if (email) {
        try {
            let user = await User.findOne({ email });

            // If the entered email has already been registered
            if (user) {
                const token = jwt.sign(
                    { _id: user._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: "77d" }
                );
                const { password, ...rest } = user._doc;
                return res.json({
                    token,
                    user: rest
                });
            }
                
            let passwordGeneration = email + process.env.JWT_SECRET;
            const hashedPassword = await hashPassword(passwordGeneration);
            const customer = await stripe.customers.create({ email });
                
            user = await new User({
                name,
                email,
                password: hashedPassword,
                stripe_customer_id: customer.id
            });
            user.save();  
            
            const token = jwt.sign(
                { _id: user._id }, 
                process.env.JWT_SECRET,
                { expiresIn: "77d" }
            );
            const { password, ...rest } = user._doc;           
            return res.status(200).json({
                token,
                user: rest
            }); 
        } catch (err) {
            console.log(err);
            res.status(400).json({
                error: 'Sign up with Facebook failed!'
            });
        }
    } else {
        return res.json({
            error: 'Facebook login failed. Try again'
        });
    }
};