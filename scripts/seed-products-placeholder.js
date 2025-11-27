const Image = require('../models/Image');
const Product = require('../models/Product');
const db = require('../config/db');

// Sample produk data dengan placeholder images
const sampleProducts = [
  {
    name: 'Bouquet Bunga Mawar',
    description: 'Bouquet indah terdiri dari mawar merah segar dengan wrapping premium',
    price: 250000,
    stock: 50,
    category: 'Bouquet',
    images: [
      'https://images.unsplash.com/photo-1530385152332-2e771f7243ca?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1530385152332-2e771f7243ca?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Bouquet Bunga Campur',
    description: 'Kombinasi bunga berwarna-warni yang cantik dan segar',
    price: 300000,
    stock: 30,
    category: 'Bouquet',
    images: [
      'https://images.unsplash.com/photo-1560257493-9e850152fb26a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560257493-9e850152fb26a?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Bunga Single Premium',
    description: 'Bunga mawar premium dengan kemasan elegan',
    price: 150000,
    stock: 100,
    category: 'Single Flower',
    images: [
      'https://images.unsplash.com/photo-1530385152332-2e771f7243ca?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1530385152332-2e771f7243ca?w=800&h=600&fit=crop'
    ]
  },
  {
    name: 'Bouquet Spesial',
    description: 'Bouquet eksklusif untuk momen spesial Anda',
    price: 450000,
    stock: 20,
    category: 'Premium',
    images: [
      'https://images.unsplash.com/photo-1560257493-9e850152fb26a?w=800&h=600&fit=crop'
    ]
  }
];

async function seedProductsWithPlaceholderImages() {
  try {
    console.log('🌱 Mulai seeding produk dengan placeholder images...');
    
    // Hapus semua produk yang ada untuk clean slate
    console.log('🧹 Membersihkan database...');
    await db.query('DELETE FROM images');
    await db.query('DELETE FROM products');
    
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
      
      // 2. Simpan gambar placeholder ke database
      for (let i = 0; i < productData.images.length; i++) {
        const imageUrl = productData.images[i];
        
        try {
          const imageData = {
            product_id: product.id,
            filename: `placeholder-${product.id}-${i + 1}.jpg`,
            original_name: `placeholder-${product.id}-${i + 1}.jpg`,
            file_path: null,
            cloudinary_url: imageUrl,
            cloudinary_public_id: null,
            file_size: 0,
            mime_type: 'image/jpeg',
            alt_text: `${productData.name} - Gambar ${i + 1}`,
            is_primary: i === 0,
            sort_order: i
          };
          
          const image = await Image.create(imageData);
          console.log(`🖼️  Placeholder image disimpan dengan ID: ${image.id}`);
          console.log(`   URL: ${imageUrl}`);
        } catch (error) {
          console.error(`❌ Gagal simpan placeholder image:`, error.message);
        }
      }
    }
    
    console.log('🎉 Seeding produk dengan placeholder images selesai!');
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error);
  } finally {
    process.exit(0);
  }
}

// Jalankan seeding
if (require.main === module) {
  seedProductsWithPlaceholderImages();
}

module.exports = { seedProductsWithPlaceholderImages, sampleProducts };
