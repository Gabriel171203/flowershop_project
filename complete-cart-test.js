// Complete Cart Functionality Test
console.log('🧪 Starting Complete Cart Test...');

// Test 1: Check Elements
console.log('\n📋 Test 1: Element Check');
const elements = {
    desktopCartBtn: document.getElementById('cart-toggle'),
    mobileCartBtn: document.getElementById('cart-toggle-mobile'),
    cartSidebar: document.getElementById('cart-sidebar'),
    cartOverlay: document.getElementById('cart-overlay'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total')
};

Object.entries(elements).forEach(([name, element]) => {
    console.log(`- ${name}: ${element ? '✅ Found' : '❌ Missing'}`);
});

// Test 2: Check Functions
console.log('\n📋 Test 2: Function Check');
const functions = {
    addToCart: typeof addToCart,
    toggleCart: typeof toggleCart,
    closeCart: typeof closeCart,
    formatRupiah: typeof formatRupiah,
    updateCartUI: typeof updateCartUI
};

Object.entries(functions).forEach(([name, type]) => {
    console.log(`- ${name}: ${type === 'function' ? '✅ Function' : '❌ Missing'}`);
});

// Test 3: Format Rupiah
console.log('\n📋 Test 3: Format Rupiah');
if (typeof formatRupiah === 'function') {
    console.log('- 250000:', formatRupiah(250000));
    console.log('- "250000":', formatRupiah("250000"));
    console.log('- 0:', formatRupiah(0));
    console.log('- undefined:', formatRupiah(undefined));
    console.log('- NaN:', formatRupiah(NaN));
} else {
    console.log('❌ formatRupiah function not found');
}

// Test 4: Cart Operations
console.log('\n📋 Test 4: Cart Operations');
if (typeof addToCart === 'function') {
    // Clear cart first
    localStorage.removeItem('cart');
    
    // Add test item
    const result = addToCart('test-1', 'Test Product', 250000, 'Test', 'test.jpg');
    console.log('- Add item result:', result);
    
    // Check cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('- Cart items:', cart.length);
    
    if (cart.length > 0) {
        const item = cart[0];
        console.log('- Item price:', item.price, typeof item.price);
        console.log('- Formatted price:', formatRupiah(item.price));
    }
    
    // Test UI update
    if (typeof updateCartUI === 'function') {
        updateCartUI();
        console.log('- UI updated');
    }
} else {
    console.log('❌ addToCart function not found');
}

// Test 5: Cart Toggle
console.log('\n📋 Test 5: Cart Toggle');
if (elements.desktopCartBtn && typeof toggleCart === 'function') {
    console.log('- Testing cart toggle...');
    
    // Test open
    setTimeout(() => {
        elements.desktopCartBtn.click();
        setTimeout(() => {
            const isOpen = !elements.cartSidebar.classList.contains('translate-x-full');
            console.log('- Cart open:', isOpen ? '✅ Yes' : '❌ No');
            
            // Test close
            setTimeout(() => {
                elements.desktopCartBtn.click();
                setTimeout(() => {
                    const isClosed = elements.cartSidebar.classList.contains('translate-x-full');
                    console.log('- Cart close:', isClosed ? '✅ Yes' : '❌ No');
                }, 300);
            }, 1000);
        }, 300);
    }, 1000);
} else {
    console.log('❌ Cannot test cart toggle - missing elements or function');
}

console.log('\n🎉 Cart Test Complete! Check results above.');
