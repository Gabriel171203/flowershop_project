-- Add sample images for products
-- Make sure you have 'images' table with columns: id, product_id, cloudinary_url, is_primary

-- Clear existing images first
DELETE FROM images;

-- Insert sample images for each product
INSERT INTO images (product_id, cloudinary_url, is_primary) VALUES
-- Product 1: Bouquet Spesial
(1, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726613/flowershop/products/product_1_primary.jpg', true),
(1, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726614/flowershop/products/product_1_secondary.jpg', false),

-- Product 2: Bunga Single Premium
(2, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726615/flowershop/products/product_2_primary.jpg', true),
(2, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726616/flowershop/products/product_2_secondary.jpg', false),

-- Product 3: Bouquet Bunga Campur
(3, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726618/flowershop/products/product_3_primary.jpg', true),
(3, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726619/flowershop/products/product_3_secondary.jpg', false),

-- Product 4: Bouquet Bunga Mawar
(4, 'https://res.cloudinary.com/dsbqmxdjz/image/upload/v1764726620/flowershop/products/product_4_primary.jpg', true);

-- Verify the data
SELECT * FROM images ORDER BY product_id, is_primary DESC;
