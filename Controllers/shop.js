const fs = require('fs');

const mongoose = require('mongoose');
const Product = require('../Models/product');
const Order = require('../Models/order');
const { createInvoice } = require('../util/createInvoices');
const PdfDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);


exports.getMainPage = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render("shop/shop",{
                products: products,
                pageTitle: 'MainPage'
            });
        })
        .catch(err => {
            next(new Error(err));
        })
}

exports.getProduct = (req, res, next) => {
    let id = req.params.productId;
    Product.findById(id)
        .then(product => {
            if(!product){
                return res.redirect('error/404');
            }
            res.render('shop/product-detail', {
                product: product,
                pageTitle: 'Detail'
            });
        })
        .catch(err => {
            res.redirect('error/404');
            console.log(err);
        });
}

exports.postCart = (req, res, next) => {
    let prodId = req.params.id;

    Product.findById(prodId)
        .then(product => {
            req.user.addToCart(product);
            res.redirect('/');
        })
        .catch(err => next(new Error(err)));
}

exports.getCart = (req, res, next) => {  
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            let products = user.cart.items.map(i => {
                return {product: {...i.productId._doc}, quantity: i.quantity};
            });
            res.render('shop/cart', {
                products: products,
                pageTitle:'Cart'          
            })
        })
        .catch(err => next(new Error(err)));
        
}

exports.postDeleteCartItem = (req, res, next) => {
   let prodId = req.body.productId;
   req.user.removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => next(new Error(err)));
}

exports.getCheckout = (req, res, next) => {
    let SubTotal = 0;
    let products
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            products = user.cart.items.map(i => {
                return {product: {...i.productId._doc}, quantity: i.quantity};
            });
           
            products.forEach(p => {
                SubTotal += p.product.price * p.quantity;
            })
            
            return stripe.checkout.sessions.create({
                payment_method_types : ['card'],
                line_items: products.map(p => {
                    return {
                        name: p.product.title,
                        description: p.product.description,
                        amount: p.product.price,
                        currency: 'vnd',
                        quantity: p.quantity
                    }
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
        })
        .then(session => {
            res.render('shop/checkout', {
                products: products,
                SubTotal: SubTotal,
                pageTitle:'Checkout',
                sessionId: session.id         
            })
        })
        .catch(err => next(new Error(err)));
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            let products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}};
            });
            
            
            let order = new Order({
                products: products,
                user: user._id,
                date: Date.now()
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
            
        })
        .then(result => {
            res.redirect('/order');
        })
        .catch(err => next(new Error(err)));
}

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            let products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}};
            });
            
            let order = new Order({
                products: products,
                user: user._id,
                date:  Date.now()
            });
            return order.save();
        })
        .then(result => {
            req.user.clearCart();
            res.redirect('/order');
        })
        .catch(err => next(new Error(err)));
}

exports.getOrders = (req, res, next) => {
    Order.find({"user" : req.user._id})
        .then(orders => {      
            res.render('shop/order', {
                orders: orders,
                pageTitle: 'Order'
            })
        })
        .catch(err => next(new Error(err)));
 }

 exports.getInvoice = (req, res, next) => {
     let orderId = req.params.orderId;

     Order.findById(orderId)
        .populate('user')
        .then(order => {
            // res.setHeader('Content-Type','application/pdf');
            // res.setHeader('Content-Disposition','attachment, filename= "invoice.pdf" ');
            var d = new PdfDocument();
            var doc = createInvoice(d,order);
            doc.pipe(res);
           
        })
        .catch(err => {
            next(new Error(err));
        })
 }