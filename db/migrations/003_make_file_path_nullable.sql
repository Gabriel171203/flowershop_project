-- Migration 003: Make file_path nullable in images table
-- Migration: 003_make_file_path_nullable.sql

-- Ubah file_path menjadi nullable untuk mendukung Cloudinary
ALTER TABLE images ALTER COLUMN file_path DROP NOT NULL;

-- Update existing records with null file_path to use cloudinary_url if available
UPDATE images 
SET file_path = NULL 
WHERE cloudinary_url IS NOT NULL AND file_path IS NOT NULL;

-- Comment untuk dokumentasi
COMMENT ON COLUMN images.file_path IS 'Local file path (nullable, used when Cloudinary is not available)';
