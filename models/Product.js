const db = require('../config/db');

class Product {
  static async getAll() {
    const query = 'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM products WHERE id = $1 AND is_active = true';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(productData) {
    const { name, description, price, stock, category, image_url } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, stock, category, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, 
      description, 
      price, 
      stock, 
      category, 
      image_url
    ]);
    
    return result.rows[0];
  }

  static async update(id, productData) {
    const { name, description, price, stock, category, image_url, is_active } = productData;
    
    const query = `
      UPDATE products 
      SET name = $1,
          description = $2,
          price = $3,
          stock = $4,
          category = $5,
          image_url = $6,
          is_active = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, 
      description, 
      price, 
      stock, 
      category, 
      image_url, 
      is_active !== undefined ? is_active : true,
      id
    ]);
    
    return result.rows[0];
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
