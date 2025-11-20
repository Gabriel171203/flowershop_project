const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders/:id', orderController.getOrderDetails);
router.get('/orders', orderController.getCustomerOrders);

// Midtrans notification handler
router.post('/payment/notification', orderController.handlePaymentNotification);

module.exports = router;
