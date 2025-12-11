// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Validasi environment variables
const requiredEnvVars = ['MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ ERROR: Environment variables tidak lengkap:');
    console.error('Silakan tambahkan variabel berikut ke file .env:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    process.exit(1);
}

// Log konfigurasi
console.log('\n🔧 Konfigurasi Aplikasi:');
console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not Configured'}`);
console.log(`- Midtrans Server Key: ${process.env.MIDTRANS_SERVER_KEY ? '***' + process.env.MIDTRANS_SERVER_KEY.slice(-4) : 'Tidak ada'}`);
console.log(`- Midtrans Client Key: ${process.env.MIDTRANS_CLIENT_KEY ? '***' + process.env.MIDTRANS_CLIENT_KEY.slice(-4) : 'Tidak ada'}\n`);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'https://app.sandbox.midtrans.com',
    'https://app.midtrans.com',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://localhost:5501'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add CSP middleware with more permissive settings for Midtrans
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self';" +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;" +
    "style-src 'self' 'unsafe-inline' https:;" +
    "img-src 'self' data: https: http:;" +
    "font-src 'self' https: data:;" +
    "frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://*.midtrans.com *;" +
    "connect-src 'self' https://api.sandbox.midtrans.com https://api.midtrans.com https://*.midtrans.com *;" +
    "form-action 'self' https://app.sandbox.midtrans.com https://app.midtrans.com;"
  );
  next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve JavaScript files with proper MIME type
app.get('/js/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'js', filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(filePath);
  } else {
    console.error('❌ JS file not found:', filePath);
    res.status(404).send('JavaScript file not found');
  }
});

// Serve images from local file system
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, filename);
  
  // Check if file exists
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Attach database to request object
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Inisialisasi Midtrans Snap
const isProduction = process.env.NODE_ENV === 'production';
const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

// API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// Deprecated payment token endpoint (kept for backward compatibility)
app.post('/api/payment/token', async (req, res) => {
  try {
    // Validasi data yang masuk
    if (!req.body.transaction_details || !req.body.transaction_details.gross_amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Data transaksi tidak valid',
        details: 'Transaction details are required'
      });
    }

    // Pastikan harga lebih dari 0
    if (parseInt(req.body.transaction_details.gross_amount) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Total pembayaran harus lebih dari 0'
      });
    }

        // Ensure order_id is set and unique
        if (!req.body.transaction_details.order_id) {
            req.body.transaction_details.order_id = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Ensure gross_amount is a number
        if (req.body.transaction_details.gross_amount) {
            req.body.transaction_details.gross_amount = parseInt(req.body.transaction_details.gross_amount);
        }

        console.log('Creating transaction with data:', JSON.stringify(req.body, null, 2));

        try {
            const transaction = await snap.createTransaction(req.body);
            
            console.log('Transaction created successfully:', {
                token: transaction.token ? 'Received' : 'Missing',
                redirect_url: transaction.redirect_url ? 'Received' : 'Missing',
                order_id: req.body.transaction_details.order_id
            });

            return res.status(200).json({
                status: 'success',
                token: transaction.token,
                redirect_url: transaction.redirect_url
            });
        } catch (apiError) {
            console.error('Midtrans API Error:', {
                message: apiError.message,
                httpStatusCode: apiError.httpStatusCode,
                apiResponse: apiError.ApiResponse || 'No additional error details'
            });

            // Handle specific error cases
            if (apiError.httpStatusCode === 401) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication failed',
                    details: 'Invalid server key or client key. Please check your Midtrans configuration.'
                });
            }

            // Handle other API errors
            let errorDetails = apiError.message;
            if (apiError.ApiResponse) {
                try {
                    const response = typeof apiError.ApiResponse === 'string' 
                        ? JSON.parse(apiError.ApiResponse) 
                        : apiError.ApiResponse;
                    
                    errorDetails = response.error_messages || response.status_message || JSON.stringify(response);
                } catch (e) {
                    errorDetails = apiError.ApiResponse.toString();
                }
            }

            return res.status(apiError.httpStatusCode || 500).json({
                status: 'error',
                message: 'Payment processing failed',
                details: errorDetails
            });
        }

    } catch (error) {
        console.error('Unexpected error in payment endpoint:', {
            message: error.message,
            stack: error.stack,
            error: error.toString()
        });

        return res.status(500).json({
            status: 'error',
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
});

// Handle all other routes by serving the main HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Import routes
const apiRoutes = require('./routes/api');

// Use API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint tidak ditemukan'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Tutup server dan proses
  server.close(() => process.exit(1));
});

// Import routes
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕒 ${new Date().toLocaleString()}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not Configured'}`);
  console.log(`🔑 Midtrans: ${process.env.MIDTRANS_SERVER_KEY ? 'Configured' : 'Not Configured'}`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🛑 Menerima sinyal untuk mematikan server...');
  
  server.close(async () => {
    console.log('🔌 Server berhenti menerima koneksi baru');
    
    try {
      // Close database connection
      if (db && typeof db.close === 'function') {
        await db.close();
        console.log('✅ Koneksi database ditutup dengan aman');
      }
      console.log('👋 Server dimatikan dengan sukses');
      process.exit(0);
    } catch (err) {
      console.error('❌ Gagal menutup koneksi dengan benar:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Memaksa penutupan server...');
    process.exit(1);
  }, 10000);
};

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
