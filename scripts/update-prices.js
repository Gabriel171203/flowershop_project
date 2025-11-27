const db = require('../config/db');

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
      console.log(`✅ Product ${productId} price updated to Rp ${newPrice.toLocaleString('id-ID')}`);
      console.log(`📦 Product: ${result.rows[0].name}`);
      return result.rows[0];
    } else {
      console.log(`❌ Product ${productId} not found`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating price:', error);
    throw error;
  }
}

async function updateAllPrices() {
  try {
    console.log('🔄 Updating product prices...\n');
    
    // Update harga untuk setiap produk
    const updates = [
      { id: 21, name: 'Bouquet Bunga Mawar', price: 275000 },      // Naik dari 250k
      { id: 22, name: 'Bouquet Bunga Campur', price: 325000 },    // Naik dari 300k  
      { id: 23, name: 'Bunga Single Premium', price: 175000 },    // Naik dari 150k
      { id: 24, name: 'Bouquet Spesial', price: 475000 }          // Naik dari 450k
    ];
    
    for (const update of updates) {
      await updateProductPrice(update.id, update.price);
      console.log('');
    }
    
    console.log('🎉 All prices updated successfully!');
    
  } catch (error) {
    console.error('❌ Failed to update prices:', error);
  } finally {
    process.exit(0);
  }
}

// Jika dijalankan langsung
if (require.main === module) {
  console.log('💰 Price Update Tool');
  console.log('===================\n');
  
  // Update harga contoh
  updateAllPrices();
}

module.exports = { updateProductPrice, updateAllPrices };
