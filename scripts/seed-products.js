const Image = require('../models/Image');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// Sample produk data
const sampleProducts = [
  {
    name: 'Bouquet Bunga Mawar',
    description: 'Bouquet indah terdiri dari mawar merah segar dengan wrapping premium',
    price: 250000,
    stock: 50,
    category: 'Bouquet',
    images: ['buket.jpg', 'buket2.jpg']
  },
  {
    name: 'Bouquet Bunga Campur',
    description: 'Kombinasi bunga berwarna-warni yang cantik dan segar',
    price: 300000,
    stock: 30,
    category: 'Bouquet',
    images: ['buket3.jpg', 'buket4.jpg']
  },
  {
    name: 'Bunga Single Premium',
    description: 'Bunga mawar premium dengan kemasan elegan',
    price: 150000,
    stock: 100,
    category: 'Single Flower',
    images: ['bungasingle.jpg', 'bungasingle2.jpg']
  },
  {
    name: 'Bouquet Spesial',
    description: 'Bouquet eksklusif untuk momen spesial Anda',
    price: 450000,
    stock: 20,
    category: 'Premium',
    images: ['buket5.jpg']
  }
];

async function seedProductsAndImages() {
  try {
    console.log('🌱 Mulai seeding produk dan gambar...');
    
    // Path ke folder project root (bukan scripts folder)
    const projectRoot = path.join(__dirname, '..');
    
    for (const productData of sampleProducts) {
      console.log(`📦 Memproses produk: ${productData.name}`);
      
      // 1. Buat produk
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        category: productData.category
      });
      
      console.log(`✅ Produk dibuat dengan ID: ${product.id}`);
      
      // 2. Upload gambar-gambar
      for (let i = 0; i < productData.images.length; i++) {
        const imageName = productData.images[i];
        const imagePath = path.join(projectRoot, imageName);
        
        // Cek apakah file ada
        if (fs.existsSync(imagePath)) {
          try {
            const altText = `${productData.name} - Gambar ${i + 1}`;
            const isPrimary = i === 0; // Gambar pertama sebagai primary
            
            const image = await Image.createFromFile(
              product.id,
              imagePath,
              imageName,
              altText,
              isPrimary
            );
            
            console.log(`🖼️  Gambar ${imageName} diupload dengan ID: ${image.id}`);
          } catch (error) {
            console.error(`❌ Gagal upload ${imageName}:`, error.message);
          }
        } else {
          console.warn(`⚠️  File tidak ditemukan: ${imagePath}`);
        }
      }
    }
    
    console.log('🎉 Seeding produk dan gambar selesai!');
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error);
  } finally {
    process.exit(0);
  }
}

// Jalankan seeding
if (require.main === module) {
  seedProductsAndImages();
}

module.exports = { seedProductsAndImages, sampleProducts };
