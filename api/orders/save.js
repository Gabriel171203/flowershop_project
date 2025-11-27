// Load environment variables
require('dotenv').config();

const db = require('../config/db');

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const orderData = req.body;
      
      console.log('📤 Saving order:', JSON.stringify(orderData, null, 2));

      // Insert order into database
      const result = await db.query(`
        INSERT INTO orders (
          customer_name, customer_email, customer_phone, 
          delivery_address, delivery_date, delivery_time,
          items, total_amount, payment_method, status,
          payment_result, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `, [
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.delivery_address,
        orderData.delivery_date,
        orderData.delivery_time,
        JSON.stringify(orderData.items),
        orderData.total_amount,
        orderData.payment_method,
        orderData.status || 'pending',
        JSON.stringify(orderData.payment_result || {})
      ]);

      const savedOrder = result.rows[0];

      console.log('✅ Order saved successfully:', savedOrder.id);

      return res.status(200).json({
        status: 'success',
        message: 'Order saved successfully',
        data: savedOrder
      });
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error saving order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
