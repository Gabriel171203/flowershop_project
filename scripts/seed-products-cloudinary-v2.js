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

// Fungsi untuk upload ke Cloudinary dengan retry
async function uploadToCloudinary(filePath, filename, productId, retryCount = 3) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`📤 Upload attempt ${attempt}/${retryCount}: ${filename}`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `toko-bunga/produk/${productId}`,
        public_id: path.parse(filename).name,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false,
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      console.log(`✅ Upload successful: ${result.public_id}`);
      return {
        cloudinary_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      console.error(`❌ Upload attempt ${attempt} failed:`, error.message);
      
      if (attempt === retryCount) {
        throw new Error(`Failed to upload ${filename} after ${retryCount} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Fungsi untuk test Cloudinary connection
async function testCloudinaryConnection() {
  try {
    console.log('🔍 Testing Cloudinary connection...');
    
    // Test dengan upload gambar test kecil
    const testResult = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', {
      folder: 'toko-bunga/test',
      public_id: 'connection-test',
      resource_type: 'auto'
    });
    
    // Delete test image
    await cloudinary.uploader.destroy('toko-bunga/test/connection-test');
    
    console.log('✅ Cloudinary connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
}

async function seedProductsAndImagesWithCloudinary() {
  try {
    console.log('🌱 Mulai seeding produk dan gambar ke Cloudinary...');
    
    // Cek konfigurasi Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing!');
      console.error('Please set these environment variables in .env file:');
      console.error('- CLOUDINARY_CLOUD_NAME');
      console.error('- CLOUDINARY_API_KEY');
      console.error('- CLOUDINARY_API_SECRET');
      console.error('\n📖 See CLOUDINARY_SETUP.md for instructions');
      process.exit(1);
    }
    
    // Test connection
    const isConnected = await testCloudinaryConnection();
    if (!isConnected) {
      process.exit(1);
    }
    
    // Path ke folder project root
    const projectRoot = path.join(__dirname, '..');
    
    // Hapus semua produk yang ada untuk clean slate
    console.log('🧹 Membersihkan database...');
    await db.query('DELETE FROM images');
    await db.query('DELETE FROM products');
    
    for (const productData of sampleProducts) {
      console.log(`\n📦 Memproses produk: ${productData.name}`);
      
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
            
            console.log(`🖼️  Processing image: ${imageName}`);
            
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
            console.log(`✅ Image uploaded and saved with ID: ${image.id}`);
            console.log(`   🌐 URL: ${cloudinaryData.cloudinary_url}`);
          } catch (error) {
            console.error(`❌ Gagal upload ${imageName}:`, error.message);
            console.log(`   ⚠️  Skipping this image and continuing...`);
          }
        } else {
          console.warn(`⚠️  File tidak ditemukan: ${imagePath}`);
          console.log(`   💡 Make sure the image files exist in the project root directory`);
        }
      }
    }
    
    console.log('\n🎉 Seeding produk dan gambar ke Cloudinary selesai!');
    console.log('📱 Check your Cloudinary dashboard to see uploaded images');
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error);
  } finally {
    process.exit(0);
  }
}

// Jalankan seeding
if (require.main === module) {
  seedProductsAndImagesWithCloudinary();
}

module.exports = { seedProductsAndImagesWithCloudinary, sampleProducts, uploadToCloudinary, testCloudinaryConnection };
