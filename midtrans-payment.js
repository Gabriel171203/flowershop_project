// Midtrans Client SDK will be loaded from CDN
// This file contains the payment handling logic

// Payment configuration
const CONFIG = {
    // These will be set when initializing the payment
    clientKey: '',
    serverKey: '',
    baseUrl: '/api/payment'
};

// Initialize payment handler
class MidtransPayment {
    constructor(options = {}) {
        this.clientKey = options.clientKey || CONFIG.clientKey;
        this.serverKey = options.serverKey || CONFIG.serverKey;
        this.baseUrl = options.baseUrl || CONFIG.baseUrl;
        this.snap = null;
        
        this.initializeSnap();
    }
    
    initializeSnap() {
        // Snap will be available globally from the CDN
        if (typeof window !== 'undefined' && window.snap) {
            this.snap = window.snap;
            this.snap.pay = this.snap.pay.bind(this.snap);
        } else {
            console.warn('Snap.js not loaded. Make sure to include the Midtrans script.');
        }
    }
    
    async pay(product, customer = {}) {
        if (!this.snap) {
            console.error('Snap.js is not initialized');
            return;
        }
        
        try {
            this.showLoading();
            
            // Generate order ID
            const orderId = 'ORDER-' + Math.round((new Date()).getTime() / 1000) + '-' + Math.round(Math.random() * 1000);
            
            // Prepare transaction details
            const transactionDetails = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: product.price
                },
                item_details: [{
                    id: product.id,
                    price: product.price,
                    quantity: 1,
                    name: product.name,
                    brand: 'Toko Bunga',
                    category: 'Bunga',
                    merchant_name: 'Toko Bunga Indah'
                }],
                customer_details: {
                    first_name: customer.name?.split(' ')[0] || 'Customer',
                    last_name: customer.name?.split(' ').slice(1).join(' ') || '',
                    email: customer.email || 'customer@example.com',
                    phone: customer.phone || '',
                    billing_address: {
                        first_name: customer.name?.split(' ')[0] || 'Customer',
                        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
                        email: customer.email || 'customer@example.com',
                        phone: customer.phone || '',
                        address: customer.address || '',
                        city: customer.city || '',
                        postal_code: customer.postalCode || '',
                        country_code: 'IDN'
                    },
                    shipping_address: {
                        first_name: customer.shippingName?.split(' ')[0] || customer.name?.split(' ')[0] || 'Customer',
                        last_name: customer.shippingName?.split(' ').slice(1).join(' ') || customer.name?.split(' ').slice(1).join(' ') || '',
                        address: customer.shippingAddress || customer.address || '',
                        city: customer.shippingCity || customer.city || '',
                        postal_code: customer.shippingPostalCode || customer.postalCode || '',
                        phone: customer.shippingPhone || customer.phone || '',
                        country_code: 'IDN'
                    }
                },
                callbacks: {
                    finish: (result) => {
                        console.log('Payment finished:', result);
                        this.redirectToThankYouPage(orderId);
                    },
                    error: (error) => {
                        console.error('Payment error:', error);
                        this.showError('Pembayaran gagal: ' + (error.message || 'Terjadi kesalahan'));
                    },
                    close: () => {
                        console.log('Payment popup closed');
                        // You can add custom behavior when the payment popup is closed
                    }
                }
            };
            
            // Get Snap token from your backend
            const response = await fetch(`${this.baseUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(this.serverKey + ':')
                },
                body: JSON.stringify(transactionDetails)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Gagal memproses pembayaran');
            }
            
            const { token } = await response.json();
            
            // Open Snap payment popup
            this.snap.pay(token, {
                onSuccess: (result) => {
                    console.log('Payment success:', result);
                    this.redirectToThankYouPage(orderId);
                },
                onPending: (result) => {
                    console.log('Payment pending:', result);
                    this.redirectToPendingPage(orderId);
                },
                onError: (error) => {
                    console.error('Payment error:', error);
                    this.showError('Pembayaran gagal: ' + (error.message || 'Terjadi kesalahan'));
                },
                onClose: () => {
                    console.log('Payment popup closed without finishing the payment');
                    // You can add custom behavior when the popup is closed
                }
            });
            
        } catch (error) {
            console.error('Error during payment:', error);
            this.showError(error.message || 'Terjadi kesalahan saat memproses pembayaran');
        } finally {
            this.hideLoading();
        }
    }
    
    showLoading() {
        // Create loading overlay if it doesn't exist
        let loading = document.getElementById('payment-loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'payment-loading';
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            loading.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
                    <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p style="margin: 0; font-size: 1.1rem;">Memproses pembayaran...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loading);
        } else {
            loading.style.display = 'flex';
        }
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }
    
    hideLoading() {
        const loading = document.getElementById('payment-loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Re-enable body scroll
        document.body.style.overflow = '';
    }
    
    showError(message) {
        // Create error message if it doesn't exist
        let errorEl = document.getElementById('payment-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'payment-error';
            errorEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #ffebee;
                color: #c62828;
                padding: 1rem 2rem;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 400px;
                display: flex;
                align-items: center;
                animation: slideIn 0.3s ease-out;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: 1rem;
                color: inherit;
                padding: 0 0.5rem;
            `;
            closeBtn.onclick = () => {
                errorEl.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (errorEl.parentNode) {
                        errorEl.parentNode.removeChild(errorEl);
                    }
                }, 300);
            };
            
            const messageEl = document.createElement('div');
            messageEl.style.flex = '1';
            
            errorEl.appendChild(messageEl);
            errorEl.appendChild(closeBtn);
            
            document.body.appendChild(errorEl);
            
            // Add animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorEl.parentNode) {
                    errorEl.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => {
                        if (errorEl.parentNode) {
                            errorEl.parentNode.removeChild(errorEl);
                        }
                    }, 300);
                }
            }, 10000);
        }
        
        // Update message
        const messageEl = errorEl.querySelector('div');
        messageEl.textContent = message;
        
        // Show the error
        errorEl.style.display = 'flex';
    }
    
    redirectToThankYouPage(orderId) {
        // You can customize this URL
        window.location.href = `/thank-you.html?order_id=${orderId}`;
    }
    
    redirectToPendingPage(orderId) {
        // You can customize this URL
        window.location.href = `/pending-payment.html?order_id=${orderId}`;
    }
}

// Initialize payment handler when the script loads
if (typeof window !== 'undefined') {
    window.MidtransPayment = MidtransPayment;
    
    // Auto-initialize with default config if data attributes are present
    document.addEventListener('DOMContentLoaded', () => {
        const paymentEl = document.querySelector('[data-midtrans-payment]');
        if (paymentEl) {
            const clientKey = paymentEl.getAttribute('data-client-key');
            const serverKey = paymentEl.getAttribute('data-server-key');
            const baseUrl = paymentEl.getAttribute('data-base-url') || '/api/payment';
            
            const payment = new MidtransPayment({
                clientKey,
                serverKey,
                baseUrl
            });
            
            // Make it globally available
            window.midtransPayment = payment;
            
            // Auto-attach click handlers to payment buttons
            document.querySelectorAll('[data-payment-product]').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const productId = button.getAttribute('data-payment-product');
                    const productName = button.getAttribute('data-product-name');
                    const productPrice = parseFloat(button.getAttribute('data-product-price'));
                    
                    // You can get customer data from a form or other elements
                    const customer = {
                        name: document.querySelector('[name="customer_name"]')?.value || '',
                        email: document.querySelector('[name="customer_email"]')?.value || '',
                        phone: document.querySelector('[name="customer_phone"]')?.value || '',
                        address: document.querySelector('[name="customer_address"]')?.value || ''
                    };
                    
                    payment.pay({
                        id: productId,
                        name: productName,
                        price: productPrice
                    }, customer);
                });
            });
        }
    });
}

export default MidtransPayment;
