// Midtrans Configuration
export const midtransConfig = {
    // Set to false for sandbox environment
    isProduction: false, // Pastikan sama dengan setting di server.js
    
    // Sandbox Client Key (harus diawali SB-)
    clientKey: 'SB-Mid-client-g9fa2aqU80sPCmuC', // Gunakan langsung nilai default untuk browser
    
    // API URL (Sandbox)
    apiUrl: 'https://app.sandbox.midtrans.com/snap/snap.js',
    
    // API Endpoint for your backend
    apiEndpoint: '/api/payment',
    
    // Environment specific settings
    env: {
        isProduction: false,
        serverUrl: 'https://app.sandbox.midtrans.com',
        clientUrl: 'https://app.sandbox.midtrans.com'
    },
    // Snap options
    snapOptions: {
        onSuccess: (result) => {
            console.log('Payment success:', result);
            if (result.finish_redirect_url) {
                window.location.href = result.finish_redirect_url;
            }
        },
        onPending: (result) => {
            console.log('Payment pending:', result);
            if (result.pending_redirect_url) {
                window.location.href = result.pending_redirect_url;
            }
        },
        onError: (error) => {
            console.error('Payment error:', error);
            alert('Pembayaran gagal: ' + error.status_message || 'Terjadi kesalahan');
        },
        onClose: () => {
            console.log('Payment popup closed');
        }
    }
};

// Application configuration
export const appConfig = {
    currency: 'IDR',
    locale: 'id-ID',
    adminWhatsApp: '6281214168584',
    companyName: 'Toko Bunga Indah'
};
