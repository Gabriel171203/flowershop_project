const db = require('../config/db');

class Order {
  // Validasi data order
  static validateOrderData(orderData) {
    if (!orderData.customer_name || orderData.customer_name.trim() === '') {
      throw new Error('Nama pelanggan harus diisi');
    }
    
    if (!orderData.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customer_email)) {
      throw new Error('Email tidak valid');
    }
    
    if (!orderData.customer_phone || orderData.customer_phone.trim() === '') {
      throw new Error('Nomor telepon harus diisi');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Item pesanan harus diisi');
    }
    
    // Validate each item
    for (const item of orderData.items) {
      if (!item.product_id) {
        throw new Error('Product ID harus diisi untuk setiap item');
      }
      
      if (!item.product_name || item.product_name.trim() === '') {
        throw new Error('Nama produk harus diisi untuk setiap item');
      }
      
      if (!item.price || isNaN(item.price) || item.price <= 0) {
        throw new Error('Harga produk tidak valid');
      }
      
      if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
        throw new Error('Quantity tidak valid');
      }
    }
    
    return true;
  }

  static async createOrder(orderData) {
    // Validate order data
    this.validateOrderData(orderData);
    
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Generate order number
      const orderNumber = 'ORD-' + Date.now();
      
      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          order_number, customer_name, customer_email, 
          customer_phone, total_amount, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, order_number, created_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        orderNumber,
        orderData.customer_name.trim(),
        orderData.customer_email.trim(),
        orderData.customer_phone.trim(),
        totalAmount,
        orderData.status || 'pending'  // Use provided status or default to pending
      ]);
      
      const orderId = orderResult.rows[0].id;
      
      // Insert order items and update product stock
      console.log('📦 Processing order items:', JSON.stringify(orderData.items, null, 2));
      const itemPromises = orderData.items.map(async item => {
        console.log('🔍 Processing item:', item);
        console.log('🔍 item.product_id:', item.product_id);
        console.log('🔍 item.product_name:', item.product_name);
        
        // Insert order item
        await client.query(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.product_id, item.product_name, item.quantity, item.price]
        );
        
        // Update product stock
        await client.query(
          'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id]
        );
      });
      
      await Promise.all(itemPromises);
      await client.query('COMMIT');
      
      return {
        id: orderResult.rows[0].id,
        order_number: orderResult.rows[0].order_number,
        created_at: orderResult.rows[0].created_at,
        total_amount: totalAmount,
        status: 'pending',
        customer_email: orderData.customer_email
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Order creation failed:', error);
      throw new Error('Gagal membuat pesanan: ' + error.message);
    } finally {
      client.release();
    }
  }

  static async updatePaymentStatus(orderId, status, paymentData = {}) {
    const query = `
      UPDATE orders 
      SET payment_status = $1, 
          payment_data = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [status, paymentData, orderId]);
    return result.rows[0];
  }

  static async getOrderById(orderId) {
    const query = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'subtotal', (oi.quantity * oi.price)
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    
    const result = await db.query(query, [orderId]);
    return result.rows[0];
  }

  static async getByOrderNumber(orderNumber) {
    const query = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'subtotal', (oi.quantity * oi.price)
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_number = $1
      GROUP BY o.id
    `;
    
    const result = await db.query(query, [orderNumber]);
    return result.rows[0];
  }

  static async updatePaymentStatusByOrderNumber(orderNumber, status, paymentData = {}) {
    const query = `
      UPDATE orders 
      SET payment_status = $1, 
          payment_data = $2,
          updated_at = NOW()
      WHERE order_number = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [status, paymentData, orderNumber]);
    return result.rows[0];
  }
}

module.exports = Order;
