const Order = require('../models/Order');
const Product = require('../models/Product');
const midtransClient = require('midtrans-client');
require('dotenv').config();

// Inisialisasi Midtrans client
let snap = null;

if (process.env.NODE_ENV !== 'test') {
  snap = new midtransClient.Snap({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
}

// Buat pesanan baru
exports.createOrder = async (req, res) => {
  console.log('📦 Order request received:', JSON.stringify(req.body, null, 2));
  
  const client = await db.getClient();
  
  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      items, 
      shipping_address,
      notes,
      payment_method,
      delivery_date,
      delivery_time,
      payment_result
    } = req.body;

    console.log('🔍 Extracted data:', {
      customer_name,
      customer_email,
      customer_phone,
      items_count: items?.length,
      shipping_address,
      payment_method,
      delivery_date,
      delivery_time,
      payment_result_status: payment_result?.status_code
    });

    // Validasi input
    if (!customer_name || !customer_email || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Validation failed:', { customer_name: !!customer_name, customer_email: !!customer_email, customer_phone: !!customer_phone, items: !!items, items_length: items?.length });
      return res.status(400).json({ error: 'Data pelanggan dan item pesanan harus diisi' });
    }

    await client.query('BEGIN');

    // Hitung total harga dan validasi stok
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.getById(item.product_id);
      
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Produk dengan ID ${item.product_id} tidak ditemukan` });
      }
      
      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.stock}` 
        });
      }
      
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      
      orderItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });
      
      // Kurangi stok produk
      await Product.updateStock(product.id, -item.quantity);
    }

    // Buat data pesanan
    const orderData = {
      customer_name,
      customer_email,
      customer_phone,
      total_amount: totalAmount,
      shipping_address,
      notes,
      items: orderItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // Simpan ke database
    const order = await Order.createOrder(orderData);
    
    // Buat transaksi Midtrans
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${order.id}-${Date.now()}`,
        gross_amount: order.total_amount
      },
      customer_details: {
        first_name: order.customer_name.split(' ')[0],
        last_name: order.customer_name.split(' ').slice(1).join(' ') || '',
        email: order.customer_email,
        phone: order.customer_phone,
      },
      item_details: orderItems.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name
      })),
      callbacks: {
        finish: `${process.env.CLIENT_URL}/order/success`,
        error: `${process.env.CLIENT_URL}/order/error`,
        pending: `${process.env.CLIENT_URL}/order/pending`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    await client.query('COMMIT');
    
    res.json({
      order_id: order.id,
      order_number: order.order_number,
      payment_url: transaction.redirect_url,
      token: transaction.token
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Gagal membuat pesanan',
      details: error.message 
    });
  } finally {
    client.release();
  }
};

// Handle notifikasi pembayaran dari Midtrans
exports.handlePaymentNotification = async (req, res) => {
  try {
    const notificationJson = req.body;
    
    // Verifikasi notifikasi
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id.split('-')[1]; // Ambil ID pesanan dari order_id
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    
    // Update status pembayaran
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        await Order.updatePaymentStatus(orderId, 'challenge', statusResponse);
      } else if (fraudStatus === 'accept') {
        await Order.updatePaymentStatus(orderId, 'paid', statusResponse);
      }
    } else if (transactionStatus === 'settlement') {
      await Order.updatePaymentStatus(orderId, 'paid', statusResponse);
    } else if (transactionStatus === 'deny' || 
               transactionStatus === 'expire' || 
               transactionStatus === 'cancel') {
      await Order.updatePaymentStatus(orderId, 'failed', statusResponse);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling payment notification:', error);
    res.status(500).json({ error: 'Gagal memproses notifikasi pembayaran' });
  }
};

// Dapatkan detail pesanan
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ error: 'Gagal mengambil detail pesanan' });
  }
};

// Dapatkan riwayat pesanan pelanggan
exports.getCustomerOrders = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email pelanggan diperlukan' });
    }
    
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
      WHERE o.customer_email = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    
    const result = await db.query(query, [email]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat pesanan' });
  }
};
