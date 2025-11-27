// Fix Products Page Checkout Button
console.log('🛒 Fixing Products Page Checkout...');

// Function to force enable checkout button
function fixProductsCheckout() {
    console.log('🔧 Checking checkout button status...');
    
    // Check cart status
    console.log('🛒 Cart status:', {
        cartExists: !!cart,
        cartLength: cart?.length || 0,
        cartItems: cart || []
    });
    
    // Find checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    console.log('🔍 Checkout button found:', !!checkoutBtn);
    
    if (checkoutBtn) {
        console.log('🔍 Current disabled state:', checkoutBtn.disabled);
        console.log('🔍 Button classes:', checkoutBtn.className);
        
        // Force enable if cart has items
        if (cart && cart.length > 0) {
            checkoutBtn.disabled = false;
            console.log('✅ Checkout button force-enabled!');
            
            // Add visual feedback
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.style.cursor = 'pointer';
            
            // Add click test
            checkoutBtn.addEventListener('click', function(e) {
                console.log('🖱️ Products checkout button clicked!');
                console.log('🛒 Cart items:', cart.length);
            });
            
        } else {
            console.log('⚠️ Cart is empty, button should be disabled');
            checkoutBtn.disabled = true;
        }
    } else {
        console.error('❌ Checkout button not found!');
        
        // Try to find by class
        const checkoutBtns = document.querySelectorAll('.checkout-btn');
        console.log('🔍 Found checkout buttons by class:', checkoutBtns.length);
        
        if (checkoutBtns.length > 0) {
            const btn = checkoutBtns[0];
            console.log('✅ Found checkout button by class');
            
            if (cart && cart.length > 0) {
                btn.disabled = false;
                console.log('✅ Checkout button (class) force-enabled!');
            }
        }
    }
}

// Function to test checkout functionality
function testProductsCheckout() {
    console.log('\n🧪 Testing products checkout...');
    
    // Add test item if cart is empty
    if (!cart || cart.length === 0) {
        console.log('📦 Adding test item to cart...');
        
        // Simulate add to cart
        if (typeof addToCart === 'function') {
            addToCart('test-prod', 'Test Product', 250000, 'Test', 'test.jpg');
            console.log('✅ Test item added to cart');
        }
    }
    
    // Check button status
    setTimeout(() => {
        fixProductsCheckout();
        
        // DISABLED: Auto-click simulation to prevent modal auto-show
        /*
        // Test click if enabled
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn && !checkoutBtn.disabled) {
            console.log('🖱️ Simulating checkout click...');
            setTimeout(() => {
                checkoutBtn.click();
                console.log('✅ Checkout clicked!');
            }, 1000);
        }
        */
    }, 2000);
}

// Function to monitor cart changes
function monitorCartChanges() {
    let lastCartLength = cart?.length || 0;
    
    setInterval(() => {
        const currentCartLength = cart?.length || 0;
        if (currentCartLength !== lastCartLength) {
            console.log('🔄 Cart changed from', lastCartLength, 'to', currentCartLength);
            lastCartLength = currentCartLength;
            
            // Update checkout button
            fixProductsCheckout();
        }
    }, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            fixProductsCheckout();
            // DISABLED: testProductsCheckout(); // Prevent auto-show modal
            monitorCartChanges();
        }, 2000);
    });
} else {
    setTimeout(() => {
        fixProductsCheckout();
        // DISABLED: testProductsCheckout(); // Prevent auto-show modal
        monitorCartChanges();
    }, 2000);
}

// Also run after products are loaded
setTimeout(() => {
    console.log('\n🔄 Double-checking products checkout...');
    fixProductsCheckout();
}, 5000);

console.log('🎉 Products checkout fix initialized!');
