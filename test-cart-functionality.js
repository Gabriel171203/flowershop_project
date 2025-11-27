// Test Cart Functionality
console.log('🧪 Testing Cart Functionality...');

// Check if functions exist
console.log('Functions available:');
console.log('- addToCart:', typeof addToCart);
console.log('- formatRupiah:', typeof formatRupiah);
console.log('- updateCartUI:', typeof updateCartUI);

// Test formatRupiah with different inputs
if (typeof formatRupiah === 'function') {
    console.log('\nTesting formatRupiah:');
    console.log('- 250000:', formatRupiah(250000));
    console.log('- "250000":', formatRupiah("250000"));
    console.log('- "250000.00":', formatRupiah("250000.00"));
    console.log('- 0:', formatRupiah(0));
}

// Test adding item to cart
if (typeof addToCart === 'function') {
    console.log('\nTesting addToCart:');
    
    // Clear cart first
    localStorage.removeItem('cart');
    
    // Test 1: Valid product
    const result1 = addToCart('test-1', 'Test Product 1', 250000, 'Test', 'test.jpg');
    console.log('- Valid product result:', result1);
    
    // Test 2: String price
    const result2 = addToCart('test-2', 'Test Product 2', "300000", 'Test', 'test.jpg');
    console.log('- String price result:', result2);
    
    // Test 3: Invalid product
    const result3 = addToCart('', 'Invalid', 0, 'Test', 'test.jpg');
    console.log('- Invalid product result:', result3);
    
    // Check cart contents
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('\nCart contents:');
    cart.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}:`);
        console.log(`   - Price: ${item.price} (${typeof item.price})`);
        console.log(`   - Formatted: ${typeof formatRupiah === 'function' ? formatRupiah(item.price) : 'N/A'}`);
        console.log(`   - Quantity: ${item.quantity}`);
    });
    
    // Test updateCartUI
    if (typeof updateCartUI === 'function') {
        console.log('\nTesting updateCartUI...');
        updateCartUI();
        console.log('updateCartUI called');
    }
} else {
    console.log('\n❌ addToCart function not available');
}

console.log('\n🎉 Cart test completed!');
