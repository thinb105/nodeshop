const express = require('express');
const { check } = require('express-validator')

const router = express.Router();

let admin = require('../Controllers/admin')

router.get('/', admin.getProducts);

router.get('/add-product', admin.getAddProductPage);
router.post('/addproduct',
    check('title').not().isEmpty().withMessage('This field can not be empty!'),
    check('price', 'Price must be a number').isNumeric(),
    admin.postProduct);

router.get('/edit-product/:productId', admin.getEditProductPage);
router.post('/edit',
    check('title').not().isEmpty().withMessage('This field can not be empty!'),
    check('price', 'Price must be a number').isNumeric(),
    admin.postEditProduct);

router.get('/delete-product/:id', admin.deleteProduct);


module.exports = router;