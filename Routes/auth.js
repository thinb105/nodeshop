const express = require('express');
const { check, body } = require('express-validator');
const User = require('../Models/user');

const authController = require('../Controllers/auth');
const checkAuth = require('../middleware/auth');

const router = express.Router();

router.get('/signup', authController.getRegister);
router.post('/signup',
    check('email').isEmail().withMessage('Email is invalid')
        .custom(value => {
            return User.findOne({ email: value }).then(user => {
                if (user) {
                    return Promise.reject('Email already in use!');
                }
            })
        }),
    check('password', 'Password must have at least 8 characters and only contains number[0-9] and alphabet[a-z]')
        .isLength({ min: 8 }).isAlphanumeric(),
    check('confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation is not correct');
        }
        return true;
    }),
    authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/logout', authController.logout);

router.get('/reset', authController.getResetPassword);
router.get('/changepassword/:token', authController.getChangePassword);
router.post('/reset',
    check('email').custom(value => {
        return User.findOne({ email: value }).then(user => {
            if (!user) {
                return Promise.reject('Email is not exist!');
            }
        })
    }),
    authController.postResetPassword);
router.post('/changepassword', authController.postChangePassword);

router.get('/profile', checkAuth, authController.getProfile);
router.post('/profile', checkAuth,
    check('phone','This phone number is invalid')
    .isLength({min:10, max:10}).isMobilePhone().isNumeric(),
    authController.postProfile
)

module.exports = router;