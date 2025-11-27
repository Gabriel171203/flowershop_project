// Load environment variables
require('dotenv').config();

// Inline database configuration
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Database query function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log(`📝 Query berhasil dieksekusi dalam ${duration}ms`, { 
      query: text, 
      params: params || 'Tidak ada parameter' 
    });
    return res;
  } catch (error) {
    console.error('❌ Error saat mengeksekusi query:', {
      error: error.message,
      query: text,
      params: params || 'Tidak ada parameter'
    });
    throw error;
  }
};

// Vercel serverless function handler
module.exports = async function handler(req, res) {
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
      const result = await query(`
        INSERT INTO orders (
          customer_name, customer_email, customer_phone, 
          shipping_address, total_amount, payment_status,
          payment_data, created_at, order_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      `, [
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.shipping_address,
        orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
        orderData.status || 'pending',
        JSON.stringify({
          payment_method: orderData.payment_method,
          delivery_date: orderData.delivery_date,
          delivery_time: orderData.delivery_time,
          items: orderData.items,
          payment_result: orderData.payment_result
        }),
        `ORDER-${Date.now()}`
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
