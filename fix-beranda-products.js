// Fix Beranda Products - Enhanced Version
console.log('🏠 Initializing Enhanced Beranda Products...');

// Function to ensure all static products work
function fixBerandaProducts() {
    const productCards = document.querySelectorAll('.product-card');
    
    console.log(`📦 Found ${productCards.length} static product cards on beranda`);
    
    productCards.forEach((card, index) => {
        console.log(`\n🏷️ Product Card ${index + 1}:`);
        console.log('- Element:', card);
        console.log('- Classes:', card.className);
        console.log('- Data ID:', card.dataset.id);
        console.log('- Data Price:', card.dataset.price);
        
        // Check price display
        const priceElement = card.querySelector('.text-accent.font-bold');
        console.log('- Price element:', priceElement);
        console.log('- Price text:', priceElement?.textContent?.trim());
        
        // Check add to cart button
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        console.log('- Add to cart button:', addToCartBtn ? '✅ Found' : '❌ Not found');
        
        if (addToCartBtn) {
            console.log('- Button classes:', addToCartBtn.className);
            console.log('- Button text:', addToCartBtn.textContent.trim());
            
            // Make sure button is visible and clickable
            addToCartBtn.style.display = 'block';
            addToCartBtn.style.visibility = 'visible';
            addToCartBtn.style.pointerEvents = 'auto';
            
            // Add visual feedback on hover
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
            
            // Add click test
            addToCartBtn.addEventListener('click', function(e) {
                console.log('🖱️ Beranda product clicked:', card.dataset.id);
                console.log('🔍 Button data:', {
                    'data-id': card.dataset.id,
                    'data-price': card.dataset.price
                });
                
                // Visual feedback
                this.innerHTML = '<i class="fas fa-check mr-2"></i>Ditambahkan!';
                this.style.background = 'linear-gradient(to right, #10b981, #059669)';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Tambah ke Keranjang';
                    this.style.background = '';
                }, 1500);
            });
        }
        
        // Make sure price is visible
        if (priceElement) {
            priceElement.style.display = 'block';
            priceElement.style.visibility = 'visible';
        }
        
        // Add hover effect to card
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Function to add missing data attributes
function addMissingDataAttributes() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Add missing data attributes if needed
        if (!card.dataset.id) {
            card.dataset.id = 'static-' + Math.random().toString(36).substr(2, 9);
            console.log('🔧 Added missing data-id:', card.dataset.id);
        }
        
        if (!card.dataset.price) {
            const priceElement = card.querySelector('.text-accent.font-bold');
            if (priceElement) {
                const priceText = priceElement.textContent.trim();
                const priceMatch = priceText.match(/Rp\s*([\d.,]+)/);
                if (priceMatch) {
                    const price = priceMatch[1].replace(/\./g, '').replace(',', '');
                    card.dataset.price = parseFloat(price);
                    console.log('🔧 Added missing data-price:', card.dataset.price);
                }
            }
        }
    });
}

// Function to test add to cart functionality
function testBerandaAddToCart() {
    const firstProduct = document.querySelector('.product-card');
    const addToCartBtn = firstProduct?.querySelector('.add-to-cart-btn');
    
    if (addToCartBtn) {
        console.log('\n🧪 Testing add to cart on beranda product...');
        
        // Simulate click
        setTimeout(() => {
            console.log('🖱️ Simulating click on first beranda product...');
            addToCartBtn.click();
            console.log('✅ Click simulated on beranda product');
        }, 3000);
    }
}

// Function to add success animation
function addSuccessAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes successPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .add-to-cart-btn.success {
            animation: successPulse 0.6s ease-in-out;
            background: linear-gradient(to right, #10b981, #059669) !important;
        }
        
        .product-card {
            transition: all 0.3s ease;
        }
        
        .product-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            addSuccessAnimation();
            fixBerandaProducts();
            addMissingDataAttributes();
            testBerandaAddToCart();
        }, 1000);
    });
} else {
    setTimeout(() => {
        addSuccessAnimation();
        fixBerandaProducts();
        addMissingDataAttributes();
        testBerandaAddToCart();
    }, 1000);
}

// Also run after a delay to make sure everything is loaded
setTimeout(() => {
    console.log('\n🔄 Double-checking beranda products...');
    fixBerandaProducts();
}, 4000);

console.log('🎉 Enhanced beranda products initialized!');
