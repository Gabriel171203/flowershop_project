-- Add sample images for products
-- Make sure you have 'images' table with columns: id, product_id, cloudinary_url, is_primary

-- Insert sample images for each product
INSERT INTO images (product_id, cloudinary_url, is_primary) VALUES
-- Product 1: Bouquet Spesial (Ganti dengan ID dan Cloudinary URL yang benar)
(1, 'CLOUDINARY_URL_PRODUCT_1_IMAGE_1', true),
(1, 'CLOUDINARY_URL_PRODUCT_1_IMAGE_2', false),

-- Product 2: Bunga Single Premium (Ganti dengan ID dan Cloudinary URL yang benar)
(2, 'CLOUDINARY_URL_PRODUCT_2_IMAGE_1', true),
(2, 'CLOUDINARY_URL_PRODUCT_2_IMAGE_2', false),

-- Product 3: Bouquet Bunga Campur (Ganti dengan ID dan Cloudinary URL yang benar)
(3, 'CLOUDINARY_URL_PRODUCT_3_IMAGE_1', true),
(3, 'CLOUDINARY_URL_PRODUCT_3_IMAGE_2', false),

-- Product 4: Bouquet Bunga Mawar (Ganti dengan ID dan Cloudinary URL yang benar)
(4, 'CLOUDINARY_URL_PRODUCT_4_IMAGE_1', true),
(4, 'CLOUDINARY_URL_PRODUCT_4_IMAGE_2', false);

-- Verify the data
SELECT * FROM images ORDER BY product_id, is_primary DESC;
