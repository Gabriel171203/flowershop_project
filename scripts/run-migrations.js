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
    
    // Path ke folder migrations
    const migrationsDir = path.join(__dirname, '../db/migrations');
    
    // Baca semua file migrasi dan urutkan
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Mengurutkan berdasarkan nama file
    
    console.log(`📁 Ditemukan ${migrationFiles.length} file migrasi`);
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📄 Menjalankan migrasi: ${file}`);
      
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      // Jalankan migrasi
      await client.query(migrationSQL);
      
      console.log(`✅ Migrasi ${file} berhasil`);
    }
    
    await client.query('COMMIT');
    console.log('🎉 Semua migrasi berhasil dijalankan');
    
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
