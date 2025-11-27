const Product = require('./models/Product');

async function testProductGetAll() {
  try {
    console.log('🧪 Testing Product.getAll()...');
    const products = await Product.getAll();
    
    console.log(`📦 Found ${products.length} products`);
    
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}: ${product.name}`);
      console.log(`- ID: ${product.id}`);
      console.log(`- Primary Image: ${product.primary_image_url}`);
      console.log(`- Images count: ${product.images ? product.images.length : 'undefined'}`);
      
      if (product.images && product.images.length > 0) {
        console.log(`- Images: ${product.images.map(img => img.filename).join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProductGetAll().then(() => process.exit(0));
