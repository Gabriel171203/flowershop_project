const db = require('../config/db');

class Product {
  static async getAll() {
    const query = `
      SELECT p.*, 
             COALESCE(i.cloudinary_url, p.image_url, '/placeholder-image.png') as primary_image_url,
             COALESCE(i.alt_text, p.name) as primary_image_alt
      FROM products p
      LEFT JOIN images i ON p.primary_image_id = i.id
      WHERE p.is_active = true 
      ORDER BY p.created_at DESC
    `;
    const products = await db.query(query);
    
    // Get all images for each product
    const productsWithImages = await Promise.all(
      products.rows.map(async (product) => {
        const imagesQuery = `
          SELECT id, filename, 
                 COALESCE(cloudinary_url, file_path, '/placeholder-image.png') as cloudinary_url, 
                 alt_text, is_primary, sort_order
          FROM images 
          WHERE product_id = $1 
          ORDER BY is_primary DESC, sort_order ASC, id ASC
        `;
        const imagesResult = await db.query(imagesQuery, [product.id]);
        
        return {
          ...product,
          images: imagesResult.rows
        };
      })
    );
    
    return productsWithImages;
  }

  static async getById(id) {
    const query = `
      SELECT p.*, 
             COALESCE(i.cloudinary_url, p.image_url, '/placeholder-image.png') as primary_image_url,
             COALESCE(i.alt_text, p.name) as primary_image_alt
      FROM products p
      LEFT JOIN images i ON p.primary_image_id = i.id
      WHERE p.id = $1 AND p.is_active = true
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async getByIdWithImages(id) {
    const productQuery = `
      SELECT p.*, 
             COALESCE(i.cloudinary_url, p.image_url, '/placeholder-image.png') as primary_image_url,
             COALESCE(i.alt_text, p.name) as primary_image_alt
      FROM products p
      LEFT JOIN images i ON p.primary_image_id = i.id
      WHERE p.id = $1 AND p.is_active = true
    `;
    
    const imagesQuery = `
      SELECT id, filename, 
             COALESCE(cloudinary_url, file_path, '/placeholder-image.png') as cloudinary_url, 
             alt_text, is_primary, sort_order
      FROM images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    
    const [productResult, imagesResult] = await Promise.all([
      db.query(productQuery, [id]),
      db.query(imagesQuery, [id])
    ]);
    
    if (productResult.rows.length === 0) {
      return null;
    }
    
    const product = productResult.rows[0];
    product.images = imagesResult.rows;
    
    return product;
  }

  static async create(productData) {
    const { name, description, price, stock, category } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, stock, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, 
      description, 
      price, 
      stock, 
      category
    ]);
    
    return result.rows[0];
  }

  static async update(id, productData) {
    const { name, description, price, stock, category, is_active } = productData;
    
    const query = `
      UPDATE products 
      SET name = $1,
          description = $2,
          price = $3,
          stock = $4,
          category = $5,
          is_active = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, 
      description, 
      price, 
      stock, 
      category, 
      is_active !== undefined ? is_active : true,
      id
    ]);
    
    return result.rows[0];
  }

  static async setPrimaryImage(productId, imageId) {
    const query = 'SELECT set_primary_image($1, $2) as success';
    const result = await db.query(query, [productId, imageId]);
    return result.rows[0].success;
  }

  static async delete(id) {
    // Soft delete
    const query = `
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateStock(id, quantityChange) {
    const query = `
      UPDATE products 
      SET stock = stock + $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [quantityChange, id]);
    return result.rows[0];
  }
}

module.exports = Product;
