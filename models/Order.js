const db = require('../config/db');

class Order {
  static async createOrder(orderData) {
    const { customer_name, customer_email, customer_phone, total_amount, items, payment_status = 'pending' } = orderData;
    
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Insert order
      const orderQuery = `
        INSERT INTO orders (customer_name, customer_email, customer_phone, total_amount, payment_status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, order_number, created_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        payment_status
      ]);
      
      const orderId = orderResult.rows[0].id;
      
      // Insert order items
      const itemPromises = items.map(item => {
        return client.query(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id, item.name, item.quantity, item.price]
        );
      });
      
      await Promise.all(itemPromises);
      await client.query('COMMIT');
      
      return {
        id: orderResult.rows[0].id,
        order_number: orderResult.rows[0].order_number,
        created_at: orderResult.rows[0].created_at,
        total_amount,
        status: payment_status
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
}

module.exports = Order;
