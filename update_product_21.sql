-- Update Product 21 to Bouquet Tulip Pink
UPDATE products 
SET 
    name = 'Bouquet Tulip Pink',
    description = 'Buket indah berisi bunga tulip pink dan bunga pink lainnya yang memanjakan mata. Sempurna untuk hadiah ulang tahun, anniversary, atau momen spesial lainnya.'
WHERE id = 21;

-- Verify the update
SELECT * FROM products WHERE id = 21;
