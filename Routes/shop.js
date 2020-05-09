const express = require('express');

const router = express.Router();

let checkAuth = require('../middleware/auth');

let shop = require('../Controllers/shop');

router.get('/', shop.getMainPage);

router.get('/product/:productId', shop.getProduct);
router.get('/addToCart/:id', checkAuth, shop.postCart);

router.get('/cart', checkAuth, shop.getCart);
router.post('/cart-delete-item/', checkAuth, shop.postDeleteCartItem);

router.get('/checkout', checkAuth, shop.getCheckout);
router.get('/checkout/success', shop.getCheckoutSuccess);
router.get('/checkout/cancel', shop.getCheckout);

router.get('/order', checkAuth, shop.getOrders);

router.get('/invoice/:orderId', checkAuth,shop.getInvoice);

module.exports = router;