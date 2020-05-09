const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');
const Product = require('../Models/product');
const { validationResult } = require('express-validator');

const fileHelper = require('../util/fileHelper');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('admin/adminPage', {
                products: products,
                pageTitle: 'Admin Page'
            })
        })
        .catch(err => {
            next(new Error(err));
        })
}

exports.getEditProductPage = (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
        .then(product => {
            if (!product) {
                return res.redirect('/admin');
            }
            return res.render('admin/edit-product', {
                product: product,
                pageTitle: 'Edit Product',
                validationErrors: []
            })
        })
        .catch(err => {
            next(new Error(err));
        })
}

exports.postEditProduct = (req, res, next) => {
    let id = req.body.productId;
    if (!id) {
        return res.render('error/404',
            { pageTitle: 'Not found!' });
    }

    let title = req.body.title;
    let price = req.body.price;
    let image = req.file;
    let description = req.body.description;

    let errors = validationResult(req);
    
    Product.findById(id)
    .then(product => {
        if(!product){
            return res.render('error/404',{ pageTitle: Error });
        }
        if (!errors.isEmpty()) {
            return res.status(422).render('admin/edit-product', {
                pageTitle: 'Edit Product',
                validationErrors: errors.array(),
                product: product
            });
        }
        product.title = title;
        product.price = price;
        if(image){
            fs.unlink(product.imageURL, (err) => {
                return new Error(err);
            })
            product.imageURL = image.path;
        }
        product.description = description;

        return product.save();
    })
    .then(result => {
        res.redirect('/admin');
    })
    .catch(err => {
        next(new Error(err));
    })
}

exports.getAddProductPage = (req, res, next) => {
    res.render('admin/add-product', {
        pageTitle: 'Add new Product',
        validationErrors: [],
        oldInput: {
            title: '',
            price: '',
            description: ''
        }
    })
}

exports.postProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const image = req.file;



    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'Add Product',
            validationErrors: errors.array(),
            oldInput: {
                title: title,
                price: price,
                description: description
            }
        });
    }

    if (!image) {
        return res.render('admin/add-product', {
            pageTitle: 'Add Product',
            validationErrors: errors.array(),
            oldInput: {
                title: title,
                price: price,
                description: description
            }
        });
    }
    let imageURL = image.path;
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageURL: imageURL,
        userID: req.user._id
    })

    product
        .save()
        .then(result => {
            res.redirect('/admin');
        })
        .catch(err => {
            next(new Error(err));
        })

}

exports.deleteProduct = (req, res, next) => {
    let id = req.params.id;
    if (!id) {
        return res.render('error/404', { pageTitle: 'Not found!' });
    }

    Product.findById(id)
        .then(product => {
            if(!product){
                return res.render('error/404', { pageTitle: 'Not Found!' });
            }

            fs.unlink(product.imageURL, (err) => {
                return new Error(err);
            })
            return Product.deleteOne({_id :id})
        })
        .then(result => {
            console.log('Removed document successfully!');
            res.redirect('/admin');
        })
        .catch(err => {
            next(new Error(err));
        })

    
        
}