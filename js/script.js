// ============================================
// CART & PAYMENT STATE
// ============================================
let cart = [];
let selectedPaymentMethod = 'qris';
let isCartInitialized = false;

// Global variables to prevent infinite loops
let cartToggleRetryCount = 0;
const MAX_CART_TOGGLE_RETRIES = 5;

// Initialize cart from localStorage when script loads
function initCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log('Cart initialized from storage:', cart);
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        cart = [];
    }
    updateCartUI();
}

// Make addToCart globally available
window.addToCart = addToCart;

// ============================================
// CORE CART FUNCTIONALITY
// ============================================

/**
 * Add item to cart or update quantity if already exists
 * @param {string} productId - The ID of the product
 * @param {string} productName - The name of the product
 * @param {number} price - The price of the product
 * @param {string} [category='Bunga'] - The category of the product
 * @param {string} [image=''] - The image URL of the product
 * @returns {boolean} True if item was added/updated, false otherwise
 */
function addToCart(productId, productName, price, category = 'Bunga', image = '') {
    // Input validation
    if (!productId || !productName || typeof price !== 'number' || price < 0) {
        console.error('Invalid product data:', { productId, productName, price });
        return false;
    }

    try {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                category: category,
                quantity: 1,
                image: image,
                addedAt: new Date().toISOString()
            });
        }
        
        saveCart();
        updateCartUI();
        
        // Show success notification
        if (typeof showAlert === 'function') {
            showAlert(`${productName} telah ditambahkan ke keranjang`, 'success');
        }
        
        return true;
    } catch (error) {
        console.error('Error adding item to cart:', error);
        if (typeof showAlert === 'function') {
            showAlert('Gagal menambahkan ke keranjang', 'error');
        }
        return false;
    }
}

/**
 * Update the cart UI to reflect current cart state
 */
function updateCartUI() {
    try {
        // Calculate total items in cart
        const cartCount = cart.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
        
        // Update all cart count indicators
        document.querySelectorAll('.cart-count').forEach(el => {
            if (el) {
                el.textContent = cartCount;
                el.style.display = cartCount > 0 ? 'flex' : 'none';
                el.setAttribute('aria-live', 'polite');
                el.setAttribute('aria-atomic', 'true');
            }
        });
        
        // Update cart items list if container exists
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        
        // Cari tombol checkout dengan ID atau class
        let checkoutButton = document.getElementById('checkout-btn');
        if (!checkoutButton) {
            checkoutButton = document.querySelector('.checkout-btn');
        }
        
        if (!cartItemsContainer) return;
        
        // Handle empty cart
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-cart text-4xl mb-2"></i>
                    <p>Keranjang belanja Anda masih kosong</p>
                </div>
            `;
            if (checkoutButton) checkoutButton.disabled = true;
            if (cartTotalElement) cartTotalElement.textContent = 'Rp 0';
            return;
        }
        
        // Build cart items HTML
        let cartHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            cartHTML += `
                <div class="flex items-center p-3 bg-white rounded-lg border mb-2">
                    <img src="${item.image || 'placeholder-image.jpg'}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div class="ml-4 flex-1">
                        <h4 class="font-medium text-gray-800">${item.name}</h4>
                        <p class="text-primary font-semibold">${formatRupiah(item.price)}</p>
                        <div class="flex items-center mt-2">
                            <button class="quantity-btn w-8 h-8 flex items-center justify-center border rounded" data-index="${index}" data-action="decrease">-</button>
                            <span class="mx-2 w-8 text-center">${item.quantity}</span>
                            <button class="quantity-btn w-8 h-8 flex items-center justify-center border rounded" data-index="${index}" data-action="increase">+</button>
                        </div>
                    </div>
                    <button class="remove-item ml-4 text-red-500 hover:text-red-700" data-index="${index}" aria-label="Hapus item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        // Update the cart items container
        cartItemsContainer.innerHTML = cartHTML;
        
        // Update total and enable/disable checkout button
        if (cartTotalElement) cartTotalElement.textContent = formatRupiah(total);
        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
            console.log('Tombol checkout di-update:', checkoutButton.disabled ? 'disabled' : 'enabled');
        }
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(button.dataset.index);
                const action = button.dataset.action;
                updateCartItem(index, action);
            });
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(button.dataset.index);
                removeFromCart(index);
            });
        });
        
    } catch (error) {
        console.error('Error updating cart UI:', error);
        if (typeof showAlert === 'function') {
            showAlert('Gagal memperbarui tampilan keranjang', 'error');
        }
    }
}

/**
 * Update quantity of an item in the cart
 * @param {number} index - Index of the item in the cart array
 * @param {string} action - 'increase' or 'decrease' the quantity
 */
function updateCartItem(index, action) {
    try {
        if (index < 0 || index >= cart.length) {
            console.error('Invalid cart item index:', index);
            return false;
        }

        if (action === 'increase') {
            cart[index].quantity += 1;
        } else if (action === 'decrease' && cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            return false; // No change made
        }
        
        if (!saveCart()) {
            console.error('Failed to save cart after update');
            return false;
        }
        
        updateCartUI();
        return true;
    } catch (error) {
        console.error('Error updating cart item:', error);
        if (typeof showAlert === 'function') {
            showAlert('Gagal memperbarui keranjang', 'error');
        }
        return false;
    }
}

// Hapus item dari keranjang
function removeFromCart(index) {
    cart.splice(index, 1);
    if (!saveCart()) {
        console.error('Failed to save cart');
    }
    updateCartUI();
    showAlert('Item telah dihapus dari keranjang', 'success');
}

/**
 * Save cart to localStorage
 * @returns {boolean} True if save was successful, false otherwise
 */
function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
        if (typeof showAlert === 'function') {
            showAlert('Gagal menyimpan keranjang', 'error');
        }
        return false;
    }
}

// Tutup keranjang
function closeCart() {
    console.log('🚪 Closing cart');
    
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay') || document.querySelector('[data-cart-overlay]');
    
    if (cartSidebar) {
        cartSidebar.classList.add('translate-x-full');
        cartSidebar.classList.remove('translate-x-0');
    }
    
    if (cartOverlay) {
        cartOverlay.style.display = 'none';
        cartOverlay.classList.add('hidden');
    }
    
    document.body.style.overflow = '';
}

/**
 * Get all items from the cart
 * @returns {Array} Array of cart items
 */
function getCartItems() {
    try {
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
        console.error('Error getting cart items:', error);
        return [];
    }
}

// ============================================
// ORDER PROCESSING
// ============================================

/**
 * Handle order form submission
 * @param {Event} event - Form submission event
 */
function submitOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Memproses...';
        
        // Get form data
        const formData = {
            customer_name: form.querySelector('#customer-name').value.trim(),
            customer_email: form.querySelector('#customer-email').value.trim(),
            customer_phone: form.querySelector('#customer-phone').value.trim(),
            customer_address: form.querySelector('#customer-address')?.value.trim() || '',
            items: getCartItems()
        };
        
        // Validate form data
        if (!formData.customer_name || !formData.customer_email || !formData.customer_phone) {
            throw new Error('Harap isi semua field yang wajib diisi');
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
            throw new Error('Format email tidak valid');
        }
        
        if (formData.items.length === 0) {
            throw new Error('Keranjang belanja Anda kosong');
        }
        
        // Submit order to backend
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.message || 'Gagal memproses pesanan');
            }
            
            // Redirect to payment page or thank you page
            if (data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                // Clear cart
                localStorage.removeItem('cart');
                updateCartCount();
                // Redirect to thank you page
                window.location.href = '/thank-you.html';
            }
        })
        .catch(error => {
            console.error('Order submission error:', error);
            showAlert(error.message || 'Terjadi kesalahan saat memproses pesanan', 'error');
        });
        
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Terjadi kesalahan', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} [type='success'] - The type of notification ('success' or 'error')
 */
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white z-50`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Format number as Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatRupiah(amount) {
    // Handle invalid inputs
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        return 'Rp 0';
    }
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

/**
 * Open WhatsApp chat with admin
 * @param {Event} event - Click event
 */
function chatAdminCustom(event) {
    event.preventDefault();
    const phoneNumber = '6281214168584'; // Replace with admin number
    const message = encodeURIComponent('Halo, saya ingin memesan buket custom');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    return false;
}

// ============================================
// CHECKOUT FLOW & MODAL HANDLING
// ============================================

// Show checkout modal
function showCheckoutModal() {
    try {
        console.log('🔍 Mencari elemen modal checkout...');
        const modal = document.getElementById('checkout-modal');
        
        if (!modal) {
            console.error('❌ Modal checkout tidak ditemukan di DOM');
            throw new Error('Modal checkout tidak ditemukan');
        }
        
        console.log('✅ Modal ditemukan:', modal);
        
        // Populate checkout items
        const checkoutItems = document.getElementById('checkout-items');
        const checkoutTotal = document.getElementById('checkout-total');
        
        if (checkoutItems && checkoutTotal) {
            let itemsHTML = '';
            let total = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                itemsHTML += `
                    <div class="flex justify-between text-sm">
                        <div>
                            <div class="font-medium">${item.name}</div>
                            <div class="text-gray-500">Qty: ${item.quantity}</div>
                        </div>
                        <div class="text-right">
                            <div>${formatRupiah(item.price)}</div>
                            <div class="font-semibold">${formatRupiah(itemTotal)}</div>
                        </div>
                    </div>
                `;
            });
            
            checkoutItems.innerHTML = itemsHTML;
            checkoutTotal.textContent = formatRupiah(total);
            
            console.log('✅ Checkout items populated:', cart.length, 'items');
            console.log('💰 Total:', formatRupiah(total));
        }
        
        console.log('📍 Menampilkan modal...');
        
        // Force remove hidden class and set display
        modal.classList.remove('hidden');
        modal.classList.add('force-show');
        
        // Force override all styles
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '9999', 'important');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('top', '0', 'important');
        modal.style.setProperty('left', '0', 'important');
        modal.style.setProperty('right', '0', 'important');
        modal.style.setProperty('bottom', '0', 'important');
        
        // Double-check with computed styles
        setTimeout(() => {
            const computed = window.getComputedStyle(modal);
            console.log('Modal computed display:', computed.display);
            console.log('Modal computed visibility:', computed.visibility);
            console.log('Modal computed opacity:', computed.opacity);
            
            if (computed.display === 'none') {
                console.warn('⚠️ Modal still hidden, forcing again...');
                modal.style.display = 'flex !important';
            }
        }, 100);
        
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Modal checkout ditampilkan dengan sukses');
        
        // Close cart if open
        closeCart();
        
        // Set minimum delivery date to tomorrow
        const deliveryDate = document.getElementById('delivery-date');
        if (deliveryDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const formattedDate = tomorrow.toISOString().split('T')[0];
            deliveryDate.min = formattedDate;
            
            // Set default date to tomorrow if not set
            if (!deliveryDate.value) {
                deliveryDate.value = formattedDate;
            }
        }
        
        // Load customer data if available
        const customerData = loadCustomerData();
        if (customerData) {
            if (customerData.name) document.getElementById('customer-name').value = customerData.name || '';
            if (customerData.email) document.getElementById('customer-email').value = customerData.email || '';
            if (customerData.phone) document.getElementById('customer-phone').value = customerData.phone || '';
            if (customerData.address) document.getElementById('customer-address').value = customerData.address || '';
        }
        
        // Update order summary
        updateOrderSummary();
        
        // Focus on first input field
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error saat menampilkan modal checkout:', error);
        showAlert('Gagal membuka halaman pembayaran', 'error');
    }
}

// Update order summary in checkout modal
function updateOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    const subtotalEl = document.getElementById('subtotal-amount');
    const totalEl = document.getElementById('total-amount');
    
    if (!orderSummary || !subtotalEl || !totalEl) return;
    
    // Clear existing items
    orderSummary.innerHTML = '';
    
    // Calculate subtotal
    let subtotal = 0;
    
    // Add each cart item to the summary
    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between items-center py-2 border-b';
        itemEl.innerHTML = `
            <div class="flex items-center">
                <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}" class="w-12 h-12 object-cover rounded mr-3">
                <div>
                    <h4 class="font-medium text-gray-800">${item.name}</h4>
                    <p class="text-sm text-gray-500">${item.quantity} x ${formatRupiah(item.price)}</p>
                </div>
            </div>
            <span class="font-medium">${formatRupiah(itemTotal)}</span>
        `;
        orderSummary.appendChild(itemEl);
    });
    
    // Update subtotal and total
    subtotalEl.textContent = formatRupiah(subtotal);
    totalEl.textContent = formatRupiah(subtotal); // You can add shipping fee here if needed
}

// Update cart UI on page load
updateCartUI();

// Close cart when clicking outside form submission
async function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('customer-name').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        deliveryDate: document.getElementById('delivery-date').value,
        deliveryTime: document.getElementById('delivery-time').value,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    // Basic validation
    const requiredFields = [
        { field: 'name', name: 'Nama lengkap' },
        { field: 'email', name: 'Email' },
        { field: 'phone', name: 'Nomor telepon' },
        { field: 'address', name: 'Alamat pengiriman' },
        { field: 'deliveryDate', name: 'Tanggal pengiriman' },
        { field: 'deliveryTime', name: 'Waktu pengiriman' }
    ];
    
    for (const { field, name } of requiredFields) {
        if (!formData[field]) {
            showAlert(`Harap isi ${name}`, 'error');
            return;
        }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showAlert('Format email tidak valid', 'error');
        return;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
        showAlert('Nomor telepon harus 10-15 digit angka', 'error');
        return;
    }
    
    // Delivery date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Pastikan deliveryDate ada dan valid
    if (!formData.deliveryDate) {
        showAlert('Harap pilih tanggal pengiriman', 'error');
        return;
    }
    
    const selectedDate = new Date(formData.deliveryDate);
    
    // Set time to 00:00:00 for accurate date comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    // Cek apakah tanggal pengiriman valid (tidak boleh hari ini atau sebelumnya)
    if (selectedDate <= today) {
        showAlert('Mohon pilih tanggal pengiriman mulai besok', 'error');
        return;
    }
    
    // Validasi waktu pengiriman
    if (!formData.deliveryTime) {
        showAlert('Harap pilih waktu pengiriman', 'error');
        return;
    }
    
    try {
        // Save customer data for future use
        saveCustomerData(formData);
        
        // Process the payment
        await processCheckout(formData.paymentMethod, formData);
        
        // Hide modal on success
        hideCheckoutModal();
        
    } catch (error) {
        console.error('Checkout error:', error);
        showAlert('Terjadi kesalahan saat memproses pembayaran', 'error');
    }
}

// Initialize checkout modal event listeners
function initCheckoutModal() {
    // Cari tombol checkout dengan ID atau class
    let checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) {
        checkoutBtn = document.querySelector('.checkout-btn');
    }
    
    const closeModalBtn = document.getElementById('close-checkout-modal');
    const cancelCheckoutBtn = document.getElementById('cancel-checkout');
    const checkoutForm = document.getElementById('checkout-form');
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('cart-overlay');
    
    // Initialize checkout button - NOTE: This is handled by setupCheckoutButton() now
    // Keeping this for backward compatibility
    if (checkoutBtn && !checkoutBtn.hasAttribute('data-checkout-initialized')) {
        checkoutBtn.setAttribute('data-checkout-initialized', 'true');
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (cart.length === 0) {
                showAlert('Keranjang belanja kosong', 'error');
                return;
            }
            showCheckoutModal();
        });
    }
    
    // Close modal buttons
    [closeModalBtn, cancelCheckoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                hideCheckoutModal();
            });
        }
    });
    
    // Form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCheckoutSubmit(e);
        });
    }
    
    // Close modal when clicking outside
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('close-modal')) {
                hideCheckoutModal();
            }
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            hideCheckoutModal();
        }
    });
    
    // Set minimum date for delivery
    const deliveryDateInput = document.getElementById('delivery-date');
    if (deliveryDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        
        // If no date is set, set it to tomorrow
        if (!deliveryDateInput.value) {
            deliveryDateInput.value = deliveryDateInput.min;
        }
    }
}

// Load customer data from localStorage
function loadCustomerData() {
    const savedData = localStorage.getItem('customerData');
    return savedData ? JSON.parse(savedData) : null;
}

// Save customer data to localStorage
function saveCustomerData(data) {
    localStorage.setItem('customerData', JSON.stringify(data));
}

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

// Buat elemen cart-sidebar jika tidak ada
function createCartSidebar() {
    console.log('🛠️ Creating cart sidebar...');
    
    // Buat elemen cart-sidebar
    const cartSidebar = document.createElement('div');
    cartSidebar.id = 'cart-sidebar';
    cartSidebar.className = 'fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out z-50 overflow-y-auto';
    
    // Isi cart-sidebar
    cartSidebar.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center border-b pb-4 mb-4">
                <h3 class="text-xl font-bold">Keranjang Belanja</h3>
                <button id="close-cart" data-close-cart class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="cart-items">
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-cart text-4xl mb-2 opacity-30"></i>
                    <p>Keranjang belanja Anda kosong</p>
                </div>
            </div>
            <div class="border-t pt-4 mt-4">
                <div class="flex justify-between items-center mb-4">
                    <span class="font-semibold">Total:</span>
                    <span id="cart-total" class="font-bold text-lg text-primary">Rp 0</span>
                </div>
                <button id="checkout-btn" class="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Lanjut ke Pembayaran
                </button>
            </div>
        </div>
    `;
    
    // Buat elemen overlay
    const cartOverlay = document.createElement('div');
    cartOverlay.id = 'cart-overlay';
    cartOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
    cartOverlay.setAttribute('data-cart-overlay', '');
    
    // Tambahkan elemen ke body
    document.body.appendChild(cartOverlay);
    document.body.appendChild(cartSidebar);
    
    console.log('✅ Cart sidebar created successfully');
    return true;
}

// Fungsi untuk inisialisasi keranjang
function initCart() {
    console.log('🚀 Initializing cart...');
    
    // Cek dan buat cart-sidebar jika belum ada
    let cartSidebar = document.getElementById('cart-sidebar');
    if (!cartSidebar) {
        console.log('Cart sidebar not found, creating...');
        const created = createCartSidebar();
        if (!created) {
            console.error('❌ Failed to create cart sidebar');
            return;
        }
        cartSidebar = document.getElementById('cart-sidebar');
    }
    
    // Temukan elemen-elemen yang diperlukan
    const elements = {
        cartSidebar: cartSidebar,
        closeCartBtn: document.getElementById('close-cart') || document.querySelector('[data-close-cart]'),
        cartOverlay: document.getElementById('cart-overlay') || document.querySelector('[data-cart-overlay]')
    };
    
    // Debug: Log semua elemen yang ditemukan
    console.log('🔍 Cart elements:', elements);
    
    // Inisialisasi status awal keranjang
    if (elements.cartSidebar) {
        initCartState(elements.cartSidebar);
        
        // Setup event listener untuk tombol tutup
        if (elements.closeCartBtn) {
            elements.closeCartBtn.addEventListener('click', closeCart);
        }
        
        // Setup overlay click listener
        if (elements.cartOverlay) {
            elements.cartOverlay.addEventListener('click', closeCart);
        }
    }
    
    console.log('✅ Cart initialized successfully');
}

// Inisialisasi status awal keranjang
function initCartState(cartSidebar) {
    if (!cartSidebar.classList.contains('translate-x-full') && 
        !cartSidebar.classList.contains('translate-x-0')) {
        cartSidebar.classList.add('translate-x-full');
    }
    
    // Sembunyikan overlay saat pertama kali dimuat
    const overlay = document.querySelector('[data-cart-overlay]');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Setup event listeners untuk keranjang
function setupCartEventListeners(elements) {
    const { cartToggle, cartToggleMobile, closeCartBtn, cartOverlay } = elements;
    
    // Setup tombol buka/tutup keranjang
    const desktopToggleSet = setupCartToggle(cartToggle);
    const mobileToggleSet = setupCartToggle(cartToggleMobile);
    
    if (!desktopToggleSet && !mobileToggleSet) {
        console.warn('⚠️ No cart toggle buttons found');
    }
    
    // Setup tombol tutup
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeCart();
        });
    }
    
    // Setup overlay
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            e.preventDefault();
            closeCart();
        });
    }
}

// Setup tombol toggle keranjang
function setupCartToggle(button) {
    if (button) {
        // Hapus event listener yang mungkin sudah ada
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart();
        });
        return true;
    }
    return false;
}

// Load products from API
async function loadProducts() {
    try {
        console.log('🔄 Loading products from API...');
        
        const response = await fetch(`/api/products`);
        const result = await response.json();
        
        console.log('📥 API Response:', result);
        
        if (result.status === 'success' && result.data) {
            console.log('✅ Products loaded:', result.data.length, 'items');
            renderProducts(result.data);
        } else {
            console.error('❌ Failed to load products:', result);
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
    }
}

// Render products to grid
function renderProducts(products) {
    const productsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4');
    
    if (!productsGrid) {
        console.error('❌ Products grid not found');
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300" data-id="${product.id}" data-price="${product.price}">
            <div class="product-image relative">
                <img src="${product.primary_image_url || '/placeholder-image.png'}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="product-badges absolute top-2 left-2">
                    <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Best Seller</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${product.description}</p>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-xl font-bold text-primary">Rp ${parseInt(product.price).toLocaleString('id-ID')}</span>
                    <span class="text-sm text-gray-500">Stok: ${product.stock}</span>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-secondary transition-colors duration-300" 
                            data-id="${product.id}" 
                            data-name="${product.name}" 
                            data-price="${product.price}"
                            data-category="${product.category || 'Bunga'}">
                        <i class="fas fa-shopping-cart mr-2"></i>Tambah ke Keranjang
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Setup add to cart buttons for new products
    setupAddToCartButtons();
}

// Initialize everything when DOM is ready
function initializeApp() {
    console.log('🚀 Initializing application...');
    
    try {
        // Load products from API
        loadProducts();
        
        // Force hide modal with CSS
        const style = document.createElement('style');
        style.textContent = `
            #checkout-modal.hidden {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -1 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Ensure checkout modal is hidden on load
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal) {
            checkoutModal.classList.add('hidden');
            checkoutModal.style.setProperty('display', 'none', 'important');
            checkoutModal.style.setProperty('visibility', 'hidden', 'important');
            checkoutModal.style.setProperty('opacity', '0', 'important');
            checkoutModal.style.setProperty('pointer-events', 'none', 'important');
            checkoutModal.style.setProperty('z-index', '-1', 'important');
            console.log('🔒 Checkout modal force hidden on load');
            
            // Double-check after 500ms to ensure it stays hidden
            setTimeout(() => {
                if (checkoutModal.style.display !== 'none') {
                    console.log('⚠️ Modal became visible, forcing hide again...');
                    checkoutModal.classList.add('hidden');
                    checkoutModal.style.setProperty('display', 'none', 'important');
                    checkoutModal.style.setProperty('visibility', 'hidden', 'important');
                    checkoutModal.style.setProperty('opacity', '0', 'important');
                    checkoutModal.style.setProperty('pointer-events', 'none', 'important');
                    checkoutModal.style.setProperty('z-index', '-1', 'important');
                }
            }, 500);
        }
        
        // Initialize cart from storage first
        initCartFromStorage();
        
        // Create cart sidebar if not exists
        createCartSidebar();
        
        // Initialize cart UI and setup event listeners
        initCart();
        
        // Initialize checkout modal
        initCheckoutModal();
        
        // Setup checkout button
        setupCheckoutButton();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
    document.addEventListener('click', function(event) {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartToggle = event.target.closest('[data-cart-toggle], [data-cart-toggle-mobile]');
        const isClickInsideCart = cartSidebar && cartSidebar.contains(event.target);
        
        if (!isClickInsideCart && !cartToggle && !event.target.closest('#cart-sidebar') && !event.target.closest('.cart-toggle')) {
            closeCart();
        }
    });
    
    console.log('✅ Aplikasi berhasil diinisialisasi');
    
    // Handle checkout modal elements
    const checkoutBtn = document.getElementById('checkout-btn');
    const backToCartBtn = document.getElementById('back-to-cart');
    const closeCheckoutModalBtn = document.getElementById('close-checkout-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutForm = document.getElementById('checkout-form');
    const orderForm = document.getElementById('order-form');
    
    // Back to cart button in checkout modal
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideCheckoutModal();
            toggleCart();
        });
    }
    
    // Close modal button
    if (closeCheckoutModalBtn) {
        closeCheckoutModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideCheckoutModal();
        });
    }
    
    // Close modal when clicking on overlay
    if (checkoutModal) {
        checkoutModal.addEventListener('click', function(e) {
            if (e.target === checkoutModal) {
                hideCheckoutModal();
            }
        });
    }
    
    // Set minimum delivery date to tomorrow
    if (document.getElementById('delivery-date')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('delivery-date').min = tomorrow.toISOString().split('T')[0];
    }
    
    // Handle checkout button click
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (cart.length === 0) return;
            
            // Hide cart items and show checkout form
            cartItemsSection.style.display = 'none';
            cartFooter.style.display = 'none';
            checkoutForm.classList.remove('hidden');
            
            // Scroll to top of the form
            checkoutForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Handle back to cart button
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show cart items and hide checkout form
            cartItemsSection.style.display = 'block';
            cartFooter.style.display = 'block';
            checkoutForm.classList.add('hidden');
        });
    }
    
    // Initialize add to cart buttons
    function setupAddToCartButtons() {
        document.addEventListener('click', function(e) {
            // Add to cart button
            const addToCartBtn = e.target.closest('.add-to-cart, .add-to-cart-btn');
            if (addToCartBtn) {
                e.preventDefault();
                e.stopPropagation();

                const productCard = addToCartBtn.closest('.product-card, [data-product-id]');
                if (productCard) {
                    // Try to get data from the product card first
                    let productId = productCard.dataset.id || productCard.dataset.productId;
                    let productPrice = productCard.dataset.price;
                    let productName = productCard.querySelector('h3, .product-name')?.textContent?.trim();
                    
                    // If not found, get from the button itself (for API-loaded products)
                    if (!productId || !productPrice) {
                        productId = addToCartBtn.dataset.productId || addToCartBtn.dataset.id;
                        productPrice = addToCartBtn.dataset.productPrice || addToCartBtn.dataset.price;
                        productName = addToCartBtn.dataset.productName || productName || 'Product';
                    }
                    
                    // Debug: Check data attributes
                    console.log('🔍 Product card found:', productCard);
                    console.log('🔍 Button data attributes:', {
                        'data-product-id': addToCartBtn.dataset.productId,
                        'data-product-price': addToCartBtn.dataset.productPrice,
                        'data-product-name': addToCartBtn.dataset.productName
                    });
                    console.log('🔍 Card data attributes:', {
                        'data-id': productCard.dataset.id,
                        'data-price': productCard.dataset.price,
                        'dataset keys': Object.keys(productCard.dataset)
                    });
                    
                    // Convert price to number
                    productPrice = parseFloat(productPrice) || 0;
                    const productImage = addToCartBtn.dataset.productImage || productCard.querySelector('img')?.src || '';

                    console.log('🛒 Adding to cart:', { 
                        productId, 
                        productName, 
                        productPrice, 
                        priceType: typeof productPrice,
                        productImage: productImage.substring(0, 50) + '...'
                    });
                    
                    addToCart(productId, productName, productPrice, 'Bunga', productImage);
                    
                    // Force update checkout button status
                    setTimeout(() => {
                        const checkoutBtn = document.getElementById('checkout-btn');
                        if (checkoutBtn && cart.length > 0) {
                            checkoutBtn.disabled = false;
                            console.log('🔧 Checkout button force-enabled after adding item');
                        }
                    }, 100);
                }
                return;
            }

            // Remove from cart button
            const removeBtn = e.target.closest('.remove-from-cart');
            if (removeBtn) {
                e.preventDefault();
                const index = parseInt(removeBtn.dataset.index);
                console.log('Removing item at index:', index);
                removeFromCart(index);
                return;
            }
        });
    }

    // Initialize close cart button
    function setupCloseCartButton() {
        const closeCartBtn = document.querySelector('[data-close-cart]');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Close cart button clicked');
                closeCart();
            });
        } else {
            console.warn('Close cart button not found');
        }
    }

    // Fungsi untuk menampilkan/menyembunyikan keranjang
    function toggleCart() {
        console.log('🔄 Toggling cart...');
        
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay') || document.querySelector('[data-cart-overlay]');
        
        if (!cartSidebar) {
            console.error('❌ Elemen keranjang tidak ditemukan');
            return;
        }
        
        // Pastikan overlay ada dan dalam state yang benar
        if (cartOverlay) {
            if (cartSidebar.classList.contains('translate-x-full')) {
                // Buka keranjang
                console.log('🛒 Opening cart');
                cartSidebar.classList.remove('translate-x-full');
                cartOverlay.style.display = 'block';
                cartOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                // Tutup keranjang
                console.log('🚪 Closing cart');
                cartSidebar.classList.add('translate-x-full');
                cartOverlay.style.display = 'none';
                cartOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            }
        } else {
            console.error('❌ Elemen overlay keranjang tidak ditemukan');
        }
    }

    // Setup semua tombol toggle keranjang
    function setupCartToggles() {
        console.log('🔍 Mencari tombol keranjang...');
        
        // Reset retry count if buttons found
        const desktopCartBtn = document.getElementById('cart-toggle') || document.querySelector('[data-cart-toggle]');
        const mobileCartBtn = document.getElementById('cart-toggle-mobile') || document.querySelector('[data-cart-toggle-mobile]');
        
        if (desktopCartBtn || mobileCartBtn) {
            console.log('✅ Tombol keranjang ditemukan');
            cartToggleRetryCount = 0; // Reset counter
            
            // Setup desktop cart toggle
            if (desktopCartBtn) {
                desktopCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Desktop cart button clicked');
                    toggleCart();
                });
                console.log('✅ Tombol keranjang desktop di-setup');
            }
            
            // Setup mobile cart toggle
            if (mobileCartBtn) {
                mobileCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Mobile cart button clicked');
                    toggleCart();
                });
                console.log('✅ Tombol keranjang mobile di-setup');
            }
            
            return;
        }
        
        // If buttons not found and we haven't exceeded max retries
        if (cartToggleRetryCount < MAX_CART_TOGGLE_RETRIES) {
            console.log(`⚠️ Tombol keranjang tidak ditemukan. Mencoba lagi... (${cartToggleRetryCount}/${MAX_CART_TOGGLE_RETRIES})`);
            setTimeout(setupCartToggles, 500);
        } else {
            console.log('⚠️ Melewati setup tombol keranjang - melebihi batas retry. Test page mungkin tidak memiliki tombol keranjang.');
            cartToggleRetryCount = 0; // Reset for future attempts
        }
    }

    // Initialize cart functionality
    function initializeCart() {
        if (!isCartInitialized) {
            initCart();
            setupCartToggles();
            setupAddToCartButtons();
            setupCloseCartButton();
            isCartInitialized = true;
        }
    }
    
    // Initialize cart when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCart);
    } else {
        initializeCart();
    }

    
    // Initial UI update
    updateCartUI();
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.querySelector('[data-cart-overlay]');
        const isClickInsideCart = cartSidebar && cartSidebar.contains(e.target);
        const isCartToggle = e.target.closest('[data-cart-toggle], [data-cart-toggle-mobile]');
        
        if (!isClickInsideCart && !isCartToggle && cartOverlay && !cartOverlay.classList.contains('hidden')) {
            closeCart();
        }
    });
};

// Update cart UI on page load
updateCartUI();

// ============================================
// CHECKOUT MODAL FUNCTIONALITY
// ============================================
function setupCheckoutButton() {
    console.log('Mengatur tombol checkout...');
    
    // Debug: Check cart status
    console.log('🛒 Cart status:', {
        cartExists: !!cart,
        cartLength: cart?.length || 0,
        cartItems: cart || []
    });
    
    // Cari semua tombol checkout yang mungkin
    const checkoutButtons = [
        document.getElementById('checkout-btn'),
        document.getElementById('submit-order-btn'),
        ...document.querySelectorAll('.checkout-btn')
    ].filter(btn => btn !== null);
    
    console.log(`🔍 Found ${checkoutButtons.length} checkout buttons:`, checkoutButtons);
    
    if (checkoutButtons.length === 0) {
        console.warn('❌ Tombol checkout tidak ditemukan');
        return;
    }
    
    // Setup untuk setiap tombol checkout
    checkoutButtons.forEach((checkoutBtn, index) => {
        console.log(`✅ Setup tombol checkout ${index + 1}:`, checkoutBtn);
        console.log(`🔍 Current disabled state:`, checkoutBtn.disabled);
        
        // Pastikan tombol memiliki parent
        if (!checkoutBtn.parentNode) {
            console.warn(`⚠️ Tombol ${index + 1} tidak memiliki parent, skip`);
            return;
        }
        
        // Hapus semua event listener yang ada dengan clone
        const newBtn = checkoutBtn.cloneNode(true);
        checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
        
        // Tambahkan event listener baru
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🖱️ Tombol checkout ${index + 1} diklik`);
            
            // Cek apakah keranjang kosong
            if (!cart || cart.length === 0) {
                showAlert('Keranjang belanja kosong', 'error');
                return;
            }
            
            console.log('🛒 Cart items:', cart.length, 'items');
            showCheckoutModal();
        });
        
        // Update status tombol berdasarkan isi keranjang
        const shouldBeDisabled = !cart || cart.length === 0;
        newBtn.disabled = shouldBeDisabled;
        
        console.log(`🔧 Tombol ${index + 1} disabled:`, shouldBeDisabled);
    });
    
    // Setup checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCheckout();
        });
    }
    
    console.log('✅ Semua tombol checkout telah diatur');
}

// Hide checkout modal
function hideCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('cart-overlay') || document.querySelector('[data-cart-overlay]');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('force-show');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
        modal.style.setProperty('z-index', '-9999', 'important');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('top', '-9999px', 'important');
        modal.style.setProperty('left', '-9999px', 'important');
        document.body.style.overflow = '';
        console.log('🚪 Checkout modal hidden');
    }
    
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
}

// Process checkout
function processCheckout() {
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    let deliveryDate = document.getElementById('delivery-date').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    
    // Auto-fill empty fields with test data for demo
    if (!name) {
        const nameInput = document.getElementById('customer-name');
        nameInput.value = 'Test Customer';
        console.log('🔧 Auto-filled name: Test Customer');
    }
    
    if (!email) {
        const emailInput = document.getElementById('customer-email');
        emailInput.value = 'test@example.com';
        console.log('🔧 Auto-filled email: test@example.com');
    }
    
    if (!phone) {
        const phoneInput = document.getElementById('customer-phone');
        phoneInput.value = '08123456789';
        console.log('🔧 Auto-filled phone: 08123456789');
    }
    
    // Set default delivery date to tomorrow if not set
    if (!deliveryDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDate = tomorrow.toISOString().split('T')[0];
        const deliveryDateInput = document.getElementById('delivery-date');
        if (deliveryDateInput) {
            deliveryDateInput.value = deliveryDate;
        }
    }
    
    // Set default delivery time if not set
    if (!deliveryTime) {
        const deliveryTimeInput = document.getElementById('delivery-time');
        if (deliveryTimeInput) {
            deliveryTimeInput.value = '09:00-12:00';
        }
    }
    
    // Get payment method
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    console.log('💳 Payment method selected:', paymentMethod);
    
    // Get updated values after auto-fill
    const finalName = document.getElementById('customer-name').value;
    const finalEmail = document.getElementById('customer-email').value;
    const finalPhone = document.getElementById('customer-phone').value;
    const finalAddress = document.getElementById('customer-address').value;
    const finalDeliveryDate = document.getElementById('delivery-date').value;
    const finalDeliveryTime = document.getElementById('delivery-time').value;
    
    // Debug: Check each field value
    console.log('🔍 Final Form Field Values:', {
        name: !!finalName,
        email: !!finalEmail,
        phone: !!finalPhone,
        address: !!finalAddress,
        deliveryDate: !!finalDeliveryDate,
        deliveryTime: !!finalDeliveryTime,
        actualValues: {
            name: finalName,
            email: finalEmail,
            phone: finalPhone,
            address: finalAddress,
            deliveryDate: finalDeliveryDate,
            deliveryTime: finalDeliveryTime
        }
    });
    
    // Check if any field is empty
    const emptyFields = [];
    if (!finalName) emptyFields.push('Nama');
    if (!finalEmail) emptyFields.push('Email');
    if (!finalPhone) emptyFields.push('No. HP');
    if (!finalAddress) emptyFields.push('Alamat');
    if (!finalDeliveryDate) emptyFields.push('Tanggal Pengiriman');
    if (!finalDeliveryTime) emptyFields.push('Waktu Pengiriman');
    
    if (emptyFields.length > 0) {
        showAlert(`Mohon lengkapi field: ${emptyFields.join(', ')}`, 'error');
        return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order data
    const orderData = {
        customer: { name: finalName, email: finalEmail, phone: finalPhone, address: finalAddress },
        delivery: { date: finalDeliveryDate, time: finalDeliveryTime },
        payment: { method: paymentMethod },
        items: cart,
        subtotal: total,
        total_amount: total,
        created_at: new Date().toISOString()
    };
    
    // Save order data globally for later use
    window.currentOrderData = {
        customer_name: finalName,
        customer_email: finalEmail,
        customer_phone: finalPhone,
        shipping_address: finalAddress,
        items: cart.map(item => ({
            product_id: item.id, // Backend expects product_id
            product_name: item.name,
            price: parseFloat(item.price), // Ensure number
            quantity: parseInt(item.quantity) // Ensure integer
        })),
        payment_method: paymentMethod,
        delivery_date: finalDeliveryDate,
        delivery_time: finalDeliveryTime
    };
    
    console.log('📦 Processing order:', orderData);
    
    // Process payment with Midtrans
    processMidtransPayment(orderData);
}

// Save order to database after successful payment
async function saveOrderToDatabase(paymentResult) {
    try {
        console.log('💾 Saving order to database...');
        console.log('🛒 Current cart structure:', JSON.stringify(cart, null, 2));
        
        // Get current order data from cart (always use fresh data)
        const orderData = {
            customer_name: document.getElementById('customer-name').value,
            customer_email: document.getElementById('customer-email').value,
            customer_phone: document.getElementById('customer-phone').value,
            shipping_address: document.getElementById('customer-address').value,
            items: cart.map(item => ({
                product_id: item.id, // Backend expects product_id
                product_name: item.name,
                price: parseFloat(item.price), // Ensure number
                quantity: parseInt(item.quantity) // Ensure integer
            })),
            payment_method: document.querySelector('input[name="payment-method"]:checked').value,
            delivery_date: document.getElementById('delivery-date').value,
            delivery_time: document.getElementById('delivery-time').value
        };
        
        // Add payment result data
        orderData.payment_result = paymentResult;
        orderData.status = 'paid';
        
        console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2));
        
        // Send to backend
        const response = await fetch(`/api/orders/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (response.ok) {
            console.log('✅ Order saved to database:', result);
            console.log('📋 Order Number:', result.order_number);
            
            // Show order details to user
            showAlert(`🎉 Pesanan berhasil! Order Number: ${result.order_number}`, 'success');
        } else {
            console.error('❌ Failed to save order:', result);
            showAlert('⚠️ Pembayaran berhasil, tapi gagal menyimpan pesanan. Hubungi admin.', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error saving order:', error);
        showAlert('⚠️ Terjadi kesalahan saat menyimpan pesanan.', 'warning');
    }
}

// Get enabled payments based on selected method
function getEnabledPayments(method) {
    // Always enable all payments for sandbox testing
    return ['credit_card', 'bca_va', 'gopay', 'shopeepay', 'qris'];
    
    // For production, uncomment below:
    /*
    const paymentMap = {
        'credit_card': ['credit_card'],
        'bca_va': ['bca_va'],
        'gopay': ['gopay'],
        'shopeepay': ['shopeepay'],
        'qris': ['qris']
    };
    
    return paymentMap[method] || ['credit_card', 'bca_va', 'gopay', 'shopeepay', 'qris'];
    */
}

// Process Midtrans Payment
async function processMidtransPayment(orderData) {
    try {
        console.log('🔄 Initiating Midtrans payment...');
        
        // Show loading
        const checkoutBtn = document.getElementById('checkout-btn');
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';
        
        // Create transaction data for Midtrans
        const transactionData = {
            transaction_details: {
                order_id: 'ORDER-' + Date.now(),
                gross_amount: orderData.total_amount
            },
            customer_details: {
                first_name: orderData.customer.name.split(' ')[0],
                last_name: orderData.customer.name.split(' ').slice(1).join(' '),
                email: orderData.customer.email,
                phone: orderData.customer.phone,
                billing_address: {
                    first_name: orderData.customer.name.split(' ')[0],
                    last_name: orderData.customer.name.split(' ').slice(1).join(' '),
                    address: orderData.customer.address,
                    city: 'Jakarta',
                    postal_code: '12345',
                    country: 'ID'
                }
            },
            item_details: orderData.items.map(item => ({
                id: item.id || 'ITEM-' + Math.random().toString(36).substr(2, 9),
                price: item.price,
                quantity: item.quantity,
                name: item.name,
                category: 'Flowers'
            })),
            custom_field: {
                delivery_date: orderData.delivery.date,
                delivery_time: orderData.delivery.time,
                payment_method: orderData.payment.method
            },
            // Enable payments based on selected method
            enabled_payments: getEnabledPayments(orderData.payment.method)
        };
        
        console.log('💳 Transaction data:', transactionData);
        
        console.log('📋 Transaction data:', transactionData);
        
        // Get Snap Token from backend
        const response = await fetch('/api/payment/token.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to get payment token');
        }
        
        const result = await response.json();
        console.log('✅ Snap token received:', result);
        
        if (result.token) {
            // Open Midtrans Snap popup
            window.snap.pay(result.token, {
                onSuccess: async function(result) {
                    console.log('✅ Payment successful:', result);
                    console.log('🛒 Cart status BEFORE save:', cart.length, 'items');
                    console.log('🛒 Cart data:', JSON.stringify(cart, null, 2));
                    
                    showAlert('🎉 Pembayaran berhasil! Terima kasih atas pesanan Anda.', 'success');
                    
                    // Save order to backend database FIRST
                    await saveOrderToDatabase(result);
                    
                    // Clear cart and close modal AFTER save is complete
                    cart = [];
                    saveCart();
                    updateCartUI();
                    hideCheckoutModal();
                    closeCart();
                },
                onPending: function(result) {
                    console.log('⏳ Payment pending:', result);
                    showAlert('⏳ Pembayaran dalam proses. Silakan lanjutkan pembayaran.', 'info');
                },
                onError: function(result) {
                    console.log('❌ Payment error:', result);
                    
                    // Better error messages based on error type
                    let errorMessage = '❌ Pembayaran gagal. Silakan coba lagi.';
                    
                    if (result && result.status_message) {
                        if (result.status_message.includes('declined')) {
                            errorMessage = '❌ Pembayaran ditolak bank. Gunakan kartu test: 4811 1111 1111 1114';
                        } else if (result.status_message.includes('expired')) {
                            errorMessage = '❌ Kartu kadaluarsa. Gunakan kartu test dengan expiry 12/25';
                        } else if (result.status_message.includes('invalid')) {
                            errorMessage = '❌ Data kartu tidak valid. Periksa kembali nomor kartu dan CVV';
                        } else {
                            errorMessage = `❌ ${result.status_message}`;
                        }
                    }
                    
                    showAlert(errorMessage, 'error');
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerHTML = originalText;
                },
                onClose: function() {
                    console.log('🚪 Payment popup closed');
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerHTML = originalText;
                }
            });
        } else {
            throw new Error('No token received');
        }
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        showAlert(`Terjadi kesalahan: ${error.message}`, 'error');
        
        // Reset button
        const checkoutBtn = document.getElementById('checkout-btn');
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Bayar Sekarang';
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}