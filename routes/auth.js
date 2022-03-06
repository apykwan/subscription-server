const express = require('express');

const { 
    register, 
    login, 
    googleLogin, 
    facebookLogin 
} = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

module.exports = router;