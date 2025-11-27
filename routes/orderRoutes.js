const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const midtransClient = require('midtrans-client');

// Initialize Midtrans client
const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Save order after successful payment (no Midtrans transaction needed)
router.post('/save', async (req, res) => {
  try {
    console.log('📦 Save order request received:', JSON.stringify(req.body, null, 2));
    
    // Create order in database only
    const order = await Order.createOrder(req.body);
    
    console.log('✅ Order saved to database:', order);
    
    // Return order success
    res.json({
      success: true,
      message: 'Order saved successfully',
      data: order
    });

  } catch (error) {
    console.error('Order save error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    // Create order in database
    const order = await Order.createOrder(req.body);
    
    // Prepare parameters for Midtrans
    const parameter = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: order.total_amount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: req.body.customer_name.split(' ')[0],
        last_name: req.body.customer_name.split(' ').slice(1).join(' ') || '',
        email: req.body.customer_email,
        phone: req.body.customer_phone
      },
      item_details: req.body.items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
        category: item.category || 'Bunga'
      }))
    };

    // Create transaction token
    const transaction = await snap.createTransaction(parameter);
    
    // Return order and payment URL
    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        ...order,
        payment_url: transaction.redirect_url,
        token: transaction.token
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Handle Midtrans notification
router.post('/notification', async (req, res) => {
  try {
    const notificationJson = req.body;
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

    // Update order status in database
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        await Order.updatePaymentStatusByOrderNumber(orderId, 'challenge');
      } else if (fraudStatus === 'accept') {
        await Order.updatePaymentStatusByOrderNumber(orderId, 'paid');
      }
    } else if (transactionStatus === 'settlement') {
      await Order.updatePaymentStatusByOrderNumber(orderId, 'paid');
    } else if (transactionStatus === 'deny' || 
               transactionStatus === 'expire' || 
               transactionStatus === 'cancel') {
      await Order.updatePaymentStatusByOrderNumber(orderId, 'cancelled');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).send('Error processing notification');
  }
});

// Check order status
router.get('/:orderId/status', async (req, res) => {
  try {
    const order = await Order.getByOrderNumber(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        status: order.payment_status,
        order_number: order.order_number,
        total_amount: order.total_amount,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check order status'
    });
  }
});

module.exports = router;
