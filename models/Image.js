const db = require('../config/db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Product = require('./Product');

class Image {
  static async create(imageData) {
    const { 
      product_id, 
      filename, 
      original_name, 
      file_path, 
      cloudinary_url, 
      cloudinary_public_id, 
      file_size, 
      mime_type, 
      alt_text, 
      is_primary = false,
      sort_order = 0 
    } = imageData;
    
    const query = `
      INSERT INTO images (
        product_id, filename, original_name, file_path, 
        cloudinary_url, cloudinary_public_id, file_size, 
        mime_type, alt_text, is_primary, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      product_id, filename, original_name, file_path,
      cloudinary_url, cloudinary_public_id, file_size,
      mime_type, alt_text, is_primary, sort_order
    ]);
    
    const image = result.rows[0];
    
    // Jika ini adalah primary image, update produk
    if (is_primary) {
      await Product.setPrimaryImage(product_id, image.id);
    }
    
    return image;
  }

  static async uploadToCloudinary(filePath, filename, productId) {
    try {
      // Upload ke Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `toko-bunga/produk/${productId}`,
        public_id: filename,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false
      });

      return {
        cloudinary_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  static async createFromFile(product_id, filePath, originalName, altText = '', isPrimary = false) {
    try {
      // Get file info
      const stats = fs.statSync(filePath);
      const filename = path.basename(filePath, path.extname(filePath));
      const extension = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      let cloudinaryUrl = null;
      let cloudinaryPublicId = null;
      
      // Coba upload ke Cloudinary jika ada konfigurasi
      try {
        const cloudinaryData = await this.uploadToCloudinary(filePath, filename, product_id);
        cloudinaryUrl = cloudinaryData.cloudinary_url;
        cloudinaryPublicId = cloudinaryData.cloudinary_public_id;
      } catch (cloudinaryError) {
        console.warn('⚠️ Cloudinary upload failed, using local file path:', cloudinaryError.message);
        // Gunakan file path lokal sebagai fallback
        cloudinaryUrl = null;
      }
      
      // Simpan ke database
      const imageData = {
        product_id,
        filename: filename + extension,
        original_name: originalName,
        file_path: filePath,
        cloudinary_url: cloudinaryUrl,
        cloudinary_public_id: cloudinaryPublicId,
        file_size: stats.size,
        mime_type: mimeTypes[extension] || 'image/jpeg',
        alt_text: altText || originalName,
        is_primary: isPrimary,
        sort_order: 0
      };
      
      return await this.create(imageData);
    } catch (error) {
      console.error('Error creating image from file:', error);
      throw error;
    }
  }

  static async getByProductId(productId) {
    const query = `
      SELECT * FROM images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    const result = await db.query(query, [productId]);
    return result.rows;
  }

  static async getPrimaryImage(productId) {
    const query = `
      SELECT * FROM images 
      WHERE product_id = $1 AND is_primary = true
      LIMIT 1
    `;
    const result = await db.query(query, [productId]);
    return result.rows[0];
  }

  static async setPrimary(imageId) {
    // Get image info
    const getImageQuery = 'SELECT product_id FROM images WHERE id = $1';
    const imageResult = await db.query(getImageQuery, [imageId]);
    
    if (imageResult.rows.length === 0) {
      throw new Error('Image not found');
    }
    
    const productId = imageResult.rows[0].product_id;
    
    // Reset all primary images for this product
    const resetQuery = 'UPDATE images SET is_primary = false WHERE product_id = $1';
    await db.query(resetQuery, [productId]);
    
    // Set this image as primary
    const setQuery = 'UPDATE images SET is_primary = true WHERE id = $1 RETURNING *';
    const result = await db.query(setQuery, [imageId]);
    
    // Update product
    await Product.setPrimaryImage(productId, imageId);
    
    return result.rows[0];
  }

  static async delete(imageId) {
    // Get image info for Cloudinary cleanup
    const getImageQuery = 'SELECT cloudinary_public_id FROM images WHERE id = $1';
    const imageResult = await db.query(getImageQuery, [imageId]);
    
    if (imageResult.rows.length === 0) {
      throw new Error('Image not found');
    }
    
    const cloudinaryPublicId = imageResult.rows[0].cloudinary_public_id;
    
    try {
      // Delete from Cloudinary
      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId);
      }
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
    }
    
    // Delete from database
    const deleteQuery = 'DELETE FROM images WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [imageId]);
    
    return result.rows[0];
  }

  static async updateSortOrder(imageId, sortOrder) {
    const query = `
      UPDATE images 
      SET sort_order = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [sortOrder, imageId]);
    return result.rows[0];
  }

  static async bulkUpload(product_id, files, altTextPrefix = '') {
    const images = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = i === 0; // First image is primary
      const altText = altTextPrefix ? `${altTextPrefix} - Gambar ${i + 1}` : `Gambar ${i + 1}`;
      
      try {
        const image = await this.createFromFile(
          product_id, 
          file.path, 
          file.originalname, 
          altText, 
          isPrimary
        );
        images.push(image);
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
      }
    }
    
    return images;
  }
}

module.exports = Image;
