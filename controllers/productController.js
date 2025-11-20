const Product = require('../models/Product');
const { upload } = require('../config/cloudinary');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Gagal mengambil detail produk' });
  }
};

// Create new product
exports.createProduct = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, price, stock, category } = req.body;
      
      // Dapatkan URL gambar dari Cloudinary
      const imageUrl = req.file ? req.file.path : null;
      
      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        image_url: imageUrl
      };
      
      const newProduct = await Product.create(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Gagal membuat produk baru' });
    }
  }
];

// Update product
exports.updateProduct = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, price, stock, category, is_active } = req.body;
      const productId = req.params.id;
      
      // Dapatkan URL gambar baru jika diunggah
      const imageUrl = req.file ? req.file.path : undefined;
      
      const productData = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        is_active: is_active === 'true',
        ...(imageUrl && { image_url: imageUrl })
      };
      
      const updatedProduct = await Product.update(productId, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Gagal memperbarui produk' });
    }
  }
];

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.delete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
};
