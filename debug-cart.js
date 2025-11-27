// Debug script untuk cart issues
console.log('🛒 Cart Debug Script');
console.log('===================');

// Test formatRupiah function
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Test dengan berbagai price values
const testPrices = [
    250000,
    "250000", 
    "250000.00",
    undefined,
    null,
    0,
    "abc"
];

console.log('Testing formatRupiah with different inputs:');
testPrices.forEach((price, index) => {
    console.log(`${index + 1}. Input: ${price} (${typeof price}) -> Output: ${formatRupiah(price)}`);
});

// Check current cart
console.log('\nCurrent cart:', JSON.parse(localStorage.getItem('cart') || '[]'));

// Check if addToCart function exists
console.log('\naddToCart function exists:', typeof addToCart);

// Check if formatRupiah function exists  
console.log('formatRupiah function exists:', typeof formatRupiah);

// Test adding item to cart
if (typeof addToCart === 'function') {
    console.log('\nTesting addToCart with valid data:');
    const result = addToCart('test-1', 'Test Product', 250000, 'Test', 'test.jpg');
    console.log('addToCart result:', result);
    
    // Check cart after adding
    const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('Cart after adding item:', updatedCart);
}
