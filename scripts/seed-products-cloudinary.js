const cloudinary = require('../config/cloudinary').cloudinary;
const Image = require('../models/Image');
const Product = require('../models/Product');
const db = require('../config/db');
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

async function uploadToCloudinary(filePath, filename, productId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `toko-bunga/produk/${productId}`,
      public_id: filename,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: false,
      transformation: [
        { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      cloudinary_url: result.secure_url,
      cloudinary_public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function seedProductsAndImagesWithCloudinary() {
  try {
    console.log('🌱 Mulai seeding produk dan gambar ke Cloudinary...');
    
    // Cek konfigurasi Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
      process.exit(1);
    }
    
    // Path ke folder project root
    const projectRoot = path.join(__dirname, '..');
    
    // Hapus semua produk yang ada untuk clean slate
    console.log('🧹 Membersihkan database...');
    await Product.deleteAll();
    
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
      
      // 2. Upload gambar-gambar ke Cloudinary
      for (let i = 0; i < productData.images.length; i++) {
        const imageName = productData.images[i];
        const imagePath = path.join(projectRoot, imageName);
        
        // Cek apakah file ada
        if (fs.existsSync(imagePath)) {
          try {
            const altText = `${productData.name} - Gambar ${i + 1}`;
            const isPrimary = i === 0; // Gambar pertama sebagai primary
            
            // Upload ke Cloudinary
            const cloudinaryData = await uploadToCloudinary(imagePath, imageName, product.id);
            
            // Simpan ke database
            const imageData = {
              product_id: product.id,
              filename: imageName,
              original_name: imageName,
              file_path: imagePath,
              cloudinary_url: cloudinaryData.cloudinary_url,
              cloudinary_public_id: cloudinaryData.cloudinary_public_id,
              file_size: fs.statSync(imagePath).size,
              mime_type: 'image/jpeg',
              alt_text: altText,
              is_primary: isPrimary,
              sort_order: i
            };
            
            const image = await Image.create(imageData);
            console.log(`🖼️  Gambar ${imageName} diupload ke Cloudinary dengan ID: ${image.id}`);
            console.log(`   URL: ${cloudinaryData.cloudinary_url}`);
          } catch (error) {
            console.error(`❌ Gagal upload ${imageName}:`, error.message);
          }
        } else {
          console.warn(`⚠️  File tidak ditemukan: ${imagePath}`);
        }
      }
    }
    
    console.log('🎉 Seeding produk dan gambar ke Cloudinary selesai!');
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error);
  } finally {
    process.exit(0);
  }
}

// Tambahkan method deleteAll ke Product model
Product.deleteAll = async function() {
  const query = 'DELETE FROM products';
  await db.query(query);
};

// Jalankan seeding
if (require.main === module) {
  seedProductsAndImagesWithCloudinary();
}

module.exports = { seedProductsAndImagesWithCloudinary, sampleProducts };
