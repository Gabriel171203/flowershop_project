const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
    // Log incoming request
    console.log('[/api/payment/token] Request received:', {
        method: req.method,
        body: req.body,
        headers: req.headers
    });
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            status: 'error',
            message: 'Method not allowed' 
        });
    }

    try {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            console.error('Midtrans server key is not configured');
            return res.status(500).json({
                status: 'error',
                message: 'Payment configuration error: Missing server key'
            });
        }

        console.log('Using Midtrans Server Key:', serverKey ? 'Configured' : 'Not configured');

        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: serverKey,
            clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-g9fa2aqU80sPCmuC'
        });

        // Validate required fields
        if (!req.body.transaction_details || !req.body.transaction_details.gross_amount) {
            return res.status(400).json({
                status: 'error',
                message: 'Transaction details are required'
            });
        }

        // Ensure order_id is set
        if (!req.body.transaction_details.order_id) {
            req.body.transaction_details.order_id = `ORDER-${Date.now()}`;
        }

        console.log('Creating transaction with data:', JSON.stringify(req.body, null, 2));

        const transaction = await snap.createTransaction(req.body);
        
        console.log('Transaction created:', {
            token: transaction.token ? 'Received' : 'Missing',
            redirect_url: transaction.redirect_url ? 'Received' : 'Missing'
        });

        return res.status(200).json({
            status: 'success',
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        console.error('Transaction error:', {
            message: error.message,
            stack: error.stack,
            apiResponse: error.ApiResponse || 'No additional error details'
        });
        
        // Handle Midtrans API error response
        let errorDetails = error.message;
        if (error.ApiResponse) {
            try {
                errorDetails = typeof error.ApiResponse === 'string' 
                    ? JSON.parse(error.ApiResponse) 
                    : error.ApiResponse;
            } catch (e) {
                errorDetails = error.ApiResponse.toString();
            }
        }

        return res.status(500).json({ 
            status: 'error',
            message: 'Failed to process payment',
            details: errorDetails
        });
    }
}