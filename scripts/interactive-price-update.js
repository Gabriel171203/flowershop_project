#!/usr/bin/env node

const db = require('../config/db');

async function showAllProducts() {
  try {
    const query = 'SELECT id, name, price FROM products ORDER BY id';
    const result = await db.query(query);
    
    console.log('📋 Daftar Produk Saat Ini:');
    console.log('========================');
    
    result.rows.forEach((product, index) => {
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(product.price);
      
      console.log(`${index + 1}. ID: ${product.id} | ${product.name}`);
      console.log(`   Harga: ${formattedPrice}\n`);
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
}

async function updateProductPrice(productId, newPrice) {
  try {
    const query = `
      UPDATE products 
      SET price = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [newPrice, productId]);
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(product.price);
      
      console.log(`✅ Berhasil update harga!`);
      console.log(`📦 Produk: ${product.name}`);
      console.log(`💰 Harga baru: ${formattedPrice}`);
      
      return product;
    } else {
      console.log(`❌ Produk dengan ID ${productId} tidak ditemukan`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating price:', error);
    throw error;
  }
}

async function interactivePriceUpdate() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('🛠️  Interactive Price Update Tool');
    console.log('================================\n');
    
    // Tampilkan semua produk
    const products = await showAllProducts();
    
    if (products.length === 0) {
      console.log('❌ Tidak ada produk ditemukan');
      rl.close();
      return;
    }
    
    // Pilih produk
    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
    
    const productId = await question('\nMasukkan ID produk yang ingin diubah harganya: ');
    const product = products.find(p => p.id == productId);
    
    if (!product) {
      console.log(`❌ Produk dengan ID ${productId} tidak ditemukan`);
      rl.close();
      return;
    }
    
    const currentPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(product.price);
    
    console.log(`\n📦 Produk: ${product.name}`);
    console.log(`💰 Harga saat ini: ${currentPrice}`);
    
    const newPrice = await question('Masukkan harga baru: ');
    const priceNum = parseInt(newPrice);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      console.log('❌ Harga tidak valid. Masukkan angka positif.');
      rl.close();
      return;
    }
    
    const formattedNewPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(priceNum);
    
    const confirm = await question(`\nKonfirmasi update harga ke ${formattedNewPrice}? (y/n): `);
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      await updateProductPrice(productId, priceNum);
      console.log('\n🎉 Harga berhasil diperbarui!');
      console.log('🔄 Refresh website untuk melihat perubahan.');
    } else {
      console.log('❌ Update dibatalkan.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Jalankan interactive update
if (require.main === module) {
  interactivePriceUpdate();
}

module.exports = { showAllProducts, updateProductPrice, interactivePriceUpdate };
