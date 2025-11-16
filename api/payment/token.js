const midtransClient = require('midtrans-client');

// Inisialisasi Snap
let snap = new midtransClient.Snap({
    isProduction: false, // Set to true for production
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const parameter = req.body;
        
        // Generate transaction token
        const transaction = await snap.createTransaction(parameter);
        
        return res.status(200).json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });
    } catch (error) {
        console.error('Error creating transaction token:', error);
        return res.status(500).json({ 
            error: 'Failed to create transaction token',
            details: error.message 
        });
    }
}
