-- Migration 002: Add images table and update products schema
-- Migration: 002_add_images_table.sql

-- Tabel untuk menyimpan informasi gambar produk
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512), -- Diubah menjadi nullable untuk Cloudinary
    cloudinary_url VARCHAR(512),
    cloudinary_public_id VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update products table untuk mendukung multiple images
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS primary_image_id INTEGER REFERENCES images(id) ON DELETE SET NULL;

-- Buat indeks untuk tabel images
CREATE INDEX IF NOT EXISTS idx_images_product_id ON images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON images(is_primary);
CREATE INDEX IF NOT EXISTS idx_images_sort_order ON images(sort_order);

-- Trigger untuk updated_at pada tabel images
DO $$
BEGIN
    -- Hapus trigger jika sudah ada
    DROP TRIGGER IF EXISTS update_images_updated_at ON images;
    
    -- Buat trigger baru
    CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Fungsi untuk mengatur primary image
CREATE OR REPLACE FUNCTION set_primary_image(product_id_param INTEGER, image_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Reset semua primary image untuk produk ini
    UPDATE images 
    SET is_primary = false 
    WHERE product_id = product_id_param;
    
    -- Set image yang dipilih sebagai primary
    UPDATE images 
    SET is_primary = true 
    WHERE id = image_id_param AND product_id = product_id_param;
    
    -- Update produk untuk mereferensikan primary image
    UPDATE products 
    SET primary_image_id = image_id_param 
    WHERE id = product_id_param;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Comment untuk dokumentasi
COMMENT ON TABLE images IS 'Tabel untuk menyimpan gambar-gambar produk';
COMMENT ON COLUMN images.cloudinary_url IS 'URL gambar di Cloudinary';
COMMENT ON COLUMN images.cloudinary_public_id IS 'Public ID untuk manipulasi gambar di Cloudinary';
COMMENT ON COLUMN images.is_primary IS 'Menandakan apakah ini adalah gambar utama produk';
COMMENT ON COLUMN images.sort_order IS 'Urutan tampilan gambar';
