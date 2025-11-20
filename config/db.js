const { Pool } = require('pg');
require('dotenv').config();

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/yourdb',
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20, // Jumlah koneksi maksimum
  idleTimeoutMillis: 30000, // Tutup koneksi yang idle selama 30 detik
  connectionTimeoutMillis: 10000, // Timeout koneksi 10 detik
});

// Test koneksi saat aplikasi dimulai
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Terhubung ke database Neon');
    const res = await client.query('SELECT NOW()');
    console.log('🕒 Waktu server database:', res.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error.message);
    process.exit(1);
  }
};

// Jalankan test koneksi
testConnection();

// Tangani error koneksi
pool.on('error', (err) => {
  console.error('⚠️ Error pada koneksi database:', err.message);
});

// Ekspor fungsi query dan getClient
module.exports = {
  // Fungsi untuk mengeksekusi query
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
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
  },
  
  // Fungsi untuk mendapatkan koneksi client
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    
    // Set timeout 10 detik untuk query yang terlalu lama
    const timeout = setTimeout(() => {
      console.error('⚠️ Query melebihi batas waktu:', {
        lastQuery: client.lastQuery,
        duration: '>10 detik'
      });
    }, 10000);

    // Patch method query untuk logging
    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };

    // Patch method release untuk membersihkan timeout
    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release.apply(client);
    };

    return client;
  },
  
  // Fungsi untuk menutup semua koneksi
  close: async () => {
    await pool.end();
    console.log('🔌 Koneksi database ditutup');
  }
};

// Tangani penutupan aplikasi
process.on('exit', () => {
  pool.end().catch(console.error);
});
