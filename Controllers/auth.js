const User = require('../Models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const nodemailer = require('nodemailer');
const sengridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator')


const Transporter = nodemailer.createTransport(sengridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}))

exports.getRegister = (req, res, next) => {
    res.render('auth/register', {
        pageTitle: 'Register',
        validationErrors: [],
        userInput: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    })
};

exports.postRegister = (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmation;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/register', {
            pageTitle: 'Register',
            validationErrors: errors.array(),
            userInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            }
        });
    }

    bcrypt.hash(password, 12)
        .then(hashPass => {
            let user = new User({
                email: email,
                password: hashPass
            });

            return user.save();
        })
        .then(result => {
            res.redirect('/auth/login');
        })
        .catch(err => {
            res.redirect('/auth/register');
        })

}

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        errorMessage: '',
        userInput: {
            email: '',
            password: ''
        }
    })
};

exports.postLogin = (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.render('auth/login', {
                    pageTitle: 'Login',
                    errorMessage: 'Email or Password is invalid',
                    userInput: {
                        email: email,
                        password: password
                    }
                });
            }
            else {
                return bcrypt.compare(password, user.password)
                    .then(result => {
                        if (!result) {
                            return res.render('auth/login', {
                                pageTitle: 'Login',
                                errorMessage: 'Email or Password is invalid',
                                userInput: {
                                    email: email,
                                    password: password
                                }
                            });
                        }
                        req.session.isAuth = true;
                        req.session.user = user;
                        res.redirect('/');
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect('/auth/login');
                    })
            }
        })
        .catch(err => {
            console.log(err);
            res.redirect('/auth/login');
        })
};

exports.logout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    })
}

exports.getResetPassword = (req, res, next) => {
    res.render('auth/reset-password', 
        { pageTitle: 'Reset password',
            errorMessage: ''
        });
}

exports.postResetPassword = (req, res, next) => {
    let email = req.body.email;

    let errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(402).render('auth/reset-password', { pageTitle: 'Reset password', errorMessage: errors.array()[0].msg});
    }

    let token;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/auth/reset');
        }

        token = buffer.toString('hex');
    })

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.redirect('/auth/reset');
            }

            user.resetToken = token;
            user.resetTokenExperation = Date.now() + 3600000;

            return user.save()
        })
        .then(result => {
            return Transporter.sendMail({
                to: email,
                from: 'quaivat105@gmail.com',
                subject: 'shop-node Reset password',
                html: `
                    <p>You just requested to reset your password</p>
                    <p>Click this <a href="${req.protocol}://${req.get('host')}/auth/changepassword/${token}">link</a></p>
                `
            })

        })
        .then(result => {
            res.render('notifications/recover-password', { pageTitle: 'Notification!' });
        })
        .catch(err => {
            res.redirect('/auth/reset');
        })
}

exports.getChangePassword = (req, res, next) => {
    let token = req.params.token;

    User.findOne({ resetToken: token, resetTokenExperation: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.render('error/token-expired', { pageTitle: 'Error' });
            }

            res.render('auth/change-password', { pageTitle: 'Change Password', userId: user._id });
        })
        .catch(err => {
            throw new Error(err);
        })
}

exports.postChangePassword = (req, res, next) => {
    let newpwd = req.body.password;
    let userId = req.body.userId;

    bcrypt.hash(newpwd, 12)
        .then(newhash => {
            User.findById(userId)
                .then(user => {
                    user.password = newhash;
                    user.resetToken = undefined;
                    user.resetTokenExperation = undefined;
                    return user.save();
                })
                .then(result => {
                    res.redirect('/auth/login');
                })
                .catch(err => {
                    throw new Error(err);
                });
        })
        .catch(err => {
            throw new Error(err);
        });
}

exports.getProfile = (req, res, next) => {
    let rdr_path = req.query.rdr;
    if(rdr_path === 'cart'){
        req.session.rdrPath = 'cart';
    }
    User.findById(req.user._id)
            .then(user => {
                res.render('auth/profile', {
                    pageTitle: 'Profile',
                    user: user,
                    errors: [],
                    oldInput: {
                        fname: '',
                        lname: '',
                        phone: '',
                        address: ''
                    }
                });
            })
            .catch(err => {
                next(new Error(err));
            })
    
}

exports.postProfile = (req, res, next) => {
    let fname = req.body.firstName;
    let lname = req.body.lastName;
    let phone = req.body.phone;
    let address = req.body.address;

    let errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/profile', {
            pageTitle: 'Profile',
            user: req.session.user,
            errors: errors.array(),
            oldInput: {
                fname: fname,
                lname: lname,
                phone: phone,
                address: address
            }
        })
    }

    req.user.updateProfile(fname,lname,phone,address)
        .then(result => {
            if(req.session.rdrPath === 'cart'){
                return res.status(200).redirect('/cart');
            }
            res.status(200).redirect('/');
        })
        .catch(err => {
            next(new Error(err));
        })
}



