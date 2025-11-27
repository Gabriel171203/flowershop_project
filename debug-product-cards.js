// Debug Product Card Data Attributes
console.log('🔍 Debugging Product Card Data Attributes...');

// Function to check all product cards
function debugProductCards() {
    const productCards = document.querySelectorAll('.product-card, [data-product-id]');
    console.log(`📋 Found ${productCards.length} product cards:`);
    
    productCards.forEach((card, index) => {
        console.log(`\n🏷️ Product Card ${index + 1}:`);
        console.log('- Element:', card);
        console.log('- Classes:', card.className);
        console.log('- Data ID:', card.dataset.id);
        console.log('- Data Price:', card.dataset.price);
        console.log('- All dataset keys:', Object.keys(card.dataset));
        
        // Check add to cart button
        const addToCartBtn = card.querySelector('.add-to-cart, .add-to-cart-btn');
        console.log('- Add to cart button:', addToCartBtn ? '✅ Found' : '❌ Not found');
        
        if (addToCartBtn) {
            console.log('- Button classes:', addToCartBtn.className);
            console.log('- Button text:', addToCartBtn.textContent.trim());
        }
        
        // Check product name
        const productName = card.querySelector('h3, .product-name');
        console.log('- Product name element:', productName ? '✅ Found' : '❌ Not found');
        console.log('- Product name:', productName?.textContent?.trim() || 'N/A');
        
        // Check image
        const productImage = card.querySelector('img');
        console.log('- Product image:', productImage ? '✅ Found' : '❌ Not found');
        console.log('- Image src:', productImage?.src?.substring(0, 50) + '...' || 'N/A');
    });
}

// Test click simulation
function testClickSimulation() {
    const firstCard = document.querySelector('.product-card, [data-product-id]');
    const addToCartBtn = firstCard?.querySelector('.add-to-cart, .add-to-cart-btn');
    
    if (addToCartBtn) {
        console.log('\n🖱️ Simulating click on first add to cart button...');
        console.log('- Button before click:', addToCartBtn);
        
        // Simulate click
        addToCartBtn.click();
        
        console.log('- Click simulated');
    } else {
        console.log('\n❌ Cannot simulate click - no button found');
    }
}

// Run debug after page loads
setTimeout(() => {
    debugProductCards();
    testClickSimulation();
}, 1000);
