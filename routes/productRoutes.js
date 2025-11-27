const express = require('express');
const Product = require('../models/Product');
const Image = require('../models/Image');
const multer = require('multer');
const router = express.Router();

// Konfigurasi Multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json({
      status: 'success',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.getByIdWithImages(id);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product',
      error: error.message
    });
  }
});

// POST /api/products - Create new product
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    
    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, price, and category are required'
      });
    }
    
    // Create product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category
    });
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      try {
        // Save uploaded files to temp directory first
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(__dirname, '../temp');
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const uploadedImages = [];
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join(tempDir, fileName);
          
          // Write file to disk
          fs.writeFileSync(filePath, file.buffer);
          
          // Create image record and upload to Cloudinary
          const image = await Image.createFromFile(
            product.id,
            filePath,
            file.originalname,
            `${name} - Gambar ${i + 1}`,
            i === 0 // First image is primary
          );
          
          uploadedImages.push(image);
          
          // Clean up temp file
          fs.unlinkSync(filePath);
        }
        
        // Get product with images
        const productWithImages = await Product.getByIdWithImages(product.id);
        
        res.status(201).json({
          status: 'success',
          data: productWithImages,
          message: 'Product created successfully with images'
        });
      } catch (imageError) {
        console.error('Error uploading images:', imageError);
        res.status(500).json({
          status: 'error',
          message: 'Product created but image upload failed',
          error: imageError.message
        });
      }
    } else {
      res.status(201).json({
        status: 'success',
        data: product,
        message: 'Product created successfully'
      });
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, is_active } = req.body;
    
    // Check if product exists
    const existingProduct = await Product.getById(id);
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Update product
    const updatedProduct = await Product.update(id, {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      is_active: is_active !== undefined ? is_active === 'true' : true
    });
    
    // Handle new image uploads if any
    if (req.files && req.files.length > 0) {
      try {
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(__dirname, '../temp');
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join(tempDir, fileName);
          
          fs.writeFileSync(filePath, file.buffer);
          
          await Image.createFromFile(
            parseInt(id),
            filePath,
            file.originalname,
            `${name || existingProduct.name} - Gambar Baru ${i + 1}`,
            false // New images are not primary by default
          );
          
          fs.unlinkSync(filePath);
        }
      } catch (imageError) {
        console.error('Error uploading new images:', imageError);
      }
    }
    
    // Get updated product with images
    const productWithImages = await Product.getByIdWithImages(id);
    
    res.json({
      status: 'success',
      data: productWithImages,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedProduct = await Product.delete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// POST /api/products/:id/images - Add images to existing product
router.post('/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, '../temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const uploadedImages = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(tempDir, fileName);
      
      fs.writeFileSync(filePath, file.buffer);
      
      const image = await Image.createFromFile(
        parseInt(id),
        filePath,
        file.originalname,
        `${product.name} - Gambar ${i + 1}`,
        false // Not primary by default
      );
      
      uploadedImages.push(image);
      fs.unlinkSync(filePath);
    }
    
    res.status(201).json({
      status: 'success',
      data: uploadedImages,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// PUT /api/products/:id/images/:imageId/primary - Set primary image
router.put('/:id/images/:imageId/primary', async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Verify product exists
    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    const updatedImage = await Image.setPrimary(parseInt(imageId));
    
    res.json({
      status: 'success',
      data: updatedImage,
      message: 'Primary image set successfully'
    });
  } catch (error) {
    console.error('Error setting primary image:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set primary image',
      error: error.message
    });
  }
});

// DELETE /api/products/:id/images/:imageId - Delete product image
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Verify product exists
    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    const deletedImage = await Image.delete(parseInt(imageId));
    
    res.json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

module.exports = router;
