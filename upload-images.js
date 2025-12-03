require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Image files to upload
const imageFiles = [
  { file: 'buket.jpg', product_id: 1, is_primary: true },
  { file: 'buket2.jpg', product_id: 1, is_primary: false },
  { file: 'bungasingle.jpg', product_id: 2, is_primary: true },
  { file: 'bungasingle2.jpg', product_id: 2, is_primary: false },
  { file: 'buket3.jpg', product_id: 3, is_primary: true },
  { file: 'buket4.jpg', product_id: 3, is_primary: false },
  { file: 'buket5.jpg', product_id: 4, is_primary: true },
];

async function uploadImages() {
  console.log('🚀 Starting image upload to Cloudinary...');
  
  try {
    for (const image of imageFiles) {
      const imagePath = path.join(__dirname, image.file);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️ File not found: ${image.file}`);
        continue;
      }
      
      console.log(`📤 Uploading ${image.file}...`);
      
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: 'flowershop/products',
        public_id: `product_${image.product_id}_${image.is_primary ? 'primary' : 'secondary'}`,
        resource_type: 'image'
      });
      
      console.log(`✅ Uploaded ${image.file}:`, result.secure_url);
      
      // Update SQL with actual URL
      console.log(`-- Product ${image.product_id}: ${image.file}`);
      console.log(`(${image.product_id}, '${result.secure_url}', ${image.is_primary}),`);
    }
    
    console.log('\n🎉 All images uploaded successfully!');
    console.log('\n📝 Update your add_sample_images.sql with the URLs above');
    
  } catch (error) {
    console.error('❌ Error uploading images:', error);
  }
}

uploadImages();
