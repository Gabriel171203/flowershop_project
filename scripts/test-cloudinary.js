const cloudinary = require('../config/cloudinary').cloudinary;
require('dotenv').config();

async function testCloudinaryConnection() {
  try {
    console.log('🔍 Testing Cloudinary connection...');
    console.log(`📋 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`🔑 API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 10)}...`);
    
    // Test dengan upload gambar test kecil (1x1 pixel PNG)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${testImageData}`, {
      folder: 'toko-bunga/test',
      public_id: 'connection-test',
      resource_type: 'auto'
    });
    
    console.log(`✅ Upload successful!`);
    console.log(`   🌐 URL: ${result.secure_url}`);
    console.log(`   📁 Public ID: ${result.public_id}`);
    
    // Delete test image
    await cloudinary.uploader.destroy('toko-bunga/test/connection-test');
    console.log('🧹 Test image deleted');
    
    console.log('\n🎉 Cloudinary connection is working perfectly!');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:');
    console.error('   Error:', error.message || error);
    
    const errorMessage = (error.message || error).toString();
    
    if (errorMessage.includes('Cloud name')) {
      console.log('\n💡 Solution: Check CLOUDINARY_CLOUD_NAME in .env');
    } else if (errorMessage.includes('api_key')) {
      console.log('\n💡 Solution: Check CLOUDINARY_API_KEY in .env');
    } else if (errorMessage.includes('api_secret')) {
      console.log('\n💡 Solution: Check CLOUDINARY_API_SECRET in .env');
    } else {
      console.log('\n💡 Solution: Check all Cloudinary credentials in .env');
    }
    
    return false;
  }
}

// Test folder listing
async function testCloudinaryFolders() {
  try {
    console.log('\n📁 Testing folder access...');
    
    const result = await cloudinary.api.sub_folders('toko-bunga');
    console.log('📂 Existing folders:', result.folders.map(f => f.name));
    
    return true;
  } catch (error) {
    console.log('📂 No existing folders (this is normal for first time setup)');
    return true;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Cloudinary Tests...\n');
  
  const connectionTest = await testCloudinaryConnection();
  
  if (connectionTest) {
    await testCloudinaryFolders();
    console.log('\n✅ All tests passed! Ready to upload images.');
  } else {
    console.log('\n❌ Tests failed. Please fix configuration and try again.');
    console.log('\n📖 Setup guide: CLOUDINARY_SETUP.md');
  }
}

// Run tests
if (require.main === module) {
  runTests().then(() => process.exit(0));
}

module.exports = { testCloudinaryConnection, testCloudinaryFolders };
