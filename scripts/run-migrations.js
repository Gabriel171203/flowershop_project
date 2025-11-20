const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  // Validasi environment variable
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL tidak ditemukan di file .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false
  });

  const client = await pool.connect().catch(err => {
    console.error('❌ Gagal terhubung ke database:', err.message);
    process.exit(1);
  });

  try {
    await client.query('BEGIN');
    
    console.log('🚀 Memulai migrasi database...');
    
    // Baca file migrasi
    const migrationPath = path.join(__dirname, '../db/migrations/001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`File migrasi tidak ditemukan di ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Jalankan migrasi
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    console.log('✅ Migrasi berhasil dijalankan');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Gagal menjalankan migrasi:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Jalankan migrasi
runMigrations().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
