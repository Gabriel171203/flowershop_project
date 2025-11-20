import { midtransConfig, appConfig } from '../config.js';

export class PaymentService {
    constructor() {
        this.snap = null;
        this.scriptLoadPromise = null;
        this.scriptLoaded = false;
        this.scriptLoading = false;
    }

    // Load Midtrans script dynamically with retry mechanism
    async loadMidtransScript() {
        // If already loaded, return
        if (this.scriptLoaded && window.snap) {
            this.snap = window.snap;
            return Promise.resolve();
        }

        // If already loading, return the existing promise
        if (this.scriptLoading && this.scriptLoadPromise) {
            return this.scriptLoadPromise;
        }

        this.scriptLoading = true;
        
        return new Promise((resolve, reject) => {
            // Check if script is already in the DOM
            const existingScript = document.querySelector(`script[src="${midtransConfig.apiUrl}"]`);
            if (existingScript) {
                // If script exists but not loaded yet, wait for it
                existingScript.onload = () => {
                    if (window.snap) {
                        this.snap = window.snap;
                        this.scriptLoaded = true;
                        this.scriptLoading = false;
                        resolve();
                    } else {
                        reject(new Error('Failed to load Midtrans script'));
                    }
                };
                existingScript.onerror = () => {
                    this.scriptLoading = false;
                    reject(new Error('Failed to load Midtrans script'));
                };
                return;
            }

            // Create new script element
            const script = document.createElement('script');
            script.src = midtransConfig.apiUrl;
            script.setAttribute('data-client-key', midtransConfig.clientKey);
            script.async = true;
            
            // Set timeout for script loading
            const timeoutId = setTimeout(() => {
                this.scriptLoading = false;
                reject(new Error('Midtrans script loading timed out'));
            }, 15000); // 15 seconds timeout

            script.onload = () => {
                clearTimeout(timeoutId);
                if (window.snap) {
                    this.snap = window.snap;
                    this.isScriptLoading = false;
                    console.log('Midtrans script loaded successfully');
                    resolve();
                } else {
                    reject(new Error('Snap object not available after script load'));
                }
            };

            script.onerror = (error) => {
                clearTimeout(timeoutId);
                this.isScriptLoading = false;
                console.error('Error loading Midtrans script:', error);
                reject(new Error('Failed to load payment processor'));
            };

            // Add script to document
            document.head.appendChild(script);
        });
    }

    // Process payment
    async processPayment(order) {
        try {
            console.log('[PaymentService] Processing payment with order:', order);
            
            // Ensure script is loaded with retry
            try {
                await this.loadMidtransScript();
            } catch (err) {
                console.error('Failed to load Midtrans script:', err);
                throw new Error('Gagal memuat sistem pembayaran. Silakan muat ulang halaman dan coba lagi.');
            }
            
            // Validate order
            if (!order || !order.transaction_details || !order.transaction_details.gross_amount) {
                const error = new Error('Invalid order data: Missing required fields');
                error.code = 'INVALID_ORDER';
                throw error;
            }

            // Convert and validate amounts
            order.transaction_details.gross_amount = parseInt(order.transaction_details.gross_amount);
            if (isNaN(order.transaction_details.gross_amount) || order.transaction_details.gross_amount <= 0) {
                const error = new Error('Invalid amount: Gross amount must be greater than 0');
                error.code = 'INVALID_AMOUNT';
                throw error;
            }
            
            // Validate and normalize item details
            if (order.item_details && order.item_details.length > 0) {
                let totalItemsAmount = 0;
                order.item_details = order.item_details.map(item => {
                    const price = parseInt(item.price) || 0;
                    const quantity = parseInt(item.quantity) || 1;
                    totalItemsAmount += price * quantity;
                    return {
                        ...item,
                        price: price,
                        quantity: quantity
                    };
                });

                // Validate that item amounts match the total
                if (Math.abs(totalItemsAmount - order.transaction_details.gross_amount) > 100) { // Allow small rounding differences
                    console.warn('Item amounts do not match total:', { 
                        itemsTotal: totalItemsAmount, 
                        orderTotal: order.transaction_details.gross_amount 
                    });
                }
            }

            console.log('[PaymentService] Sending payment request to backend...');
            let response;
            let data;
            
            try {
                response = await fetch('/api/payment/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(order),
                    credentials: 'same-origin'
                });
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Unexpected response format: ${text.substring(0, 200)}`);
                }
                
                if (!response.ok) {
                    console.error('Payment API Error:', { 
                        status: response.status, 
                        statusText: response.statusText,
                        data 
                    });
                    
                    const error = new Error(data.message || `Payment failed with status ${response.status}`);
                    error.response = { status: response.status, data };
                    throw error;
                }
                
            } catch (error) {
                console.error('Network/API Error:', error);
                if (!error.response) {
                    error.response = { status: 0, data: { message: 'Network error' }};
                }
                throw error;
            }
            
            // Initialize payment with Snap
            if (window.snap && data.token) {
                console.log('Initializing Snap payment with token:', data.token);
                
                return new Promise((resolve, reject) => {
                    window.snap.pay(data.token, {
                        onSuccess: (result) => {
                            console.log('Payment success:', result);
                            if (data.redirect_url) {
                                window.location.href = data.redirect_url;
                            }
                            resolve({ success: true, result });
                        },
                        onPending: (result) => {
                            console.log('Payment pending:', result);
                            if (data.redirect_url) {
                                window.location.href = data.redirect_url;
                            }
                        },
                        onError: (error) => {
                            console.error('Payment error:', error);
                            if (data.error_url) {
                                window.location.href = data.error_url;
                            }
                            reject(new Error('Payment was not completed'));
                        },
                        onClose: () => {
                            console.log('Payment popup closed');
                            reject(new Error('Payment popup was closed'));
                        }
                    });
                });
            } else {
                throw new Error('Failed to initialize payment: Missing token or Snap not loaded');
            }

            return responseData;
            
        } catch (error) {
            console.error('Error processing payment:', error);
            throw new Error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat(appConfig.locale, {
            style: 'currency',
            currency: appConfig.currency,
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Create a singleton instance
export const paymentService = new PaymentService();
