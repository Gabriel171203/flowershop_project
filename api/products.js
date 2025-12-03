// Load environment variables
require('dotenv').config();

const db = require('../config/db');

// Vercel serverless function handler
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      console.log('🌐 Fetching products from database...');
      
      // Query products from database
      const result = await db.query(`
        SELECT 
          p.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', i.id,
                'url', i.cloudinary_url,
                'is_primary', i.is_primary
              ) 
              ORDER BY i.is_primary DESC
              NULLS LAST
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::json
          ) as images
        FROM products p
        LEFT JOIN images i ON p.id = i.product_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);

      const products = result.rows.map(product => {
        // Ensure images is an array and handle both URL formats
        const images = Array.isArray(product.images) 
          ? product.images
              .filter(img => img && (img.url || img.cloudinary_url))
              .map(img => ({
                id: img.id,
                url: img.url || img.cloudinary_url,
                is_primary: img.is_primary || false
              }))
          : [];

        // Find primary image or use first available
        const primaryImage = images.find(img => img.is_primary) || images[0];

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          images: images,
          primary_image: images[0] || null,
          category: product.category || 'Bunga',
          stock: product.stock || 10
        };
      });

      console.log(`✅ Found ${products.length} products with images`);
      
      return res.status(200).json({
        status: 'success',
        data: products,
        count: products.length
      });
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Error in products API:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
