# Setup Cloudinary untuk Toko Bunga

## 1. Buat Akun Cloudinary

1. Kunjungi https://cloudinary.com/
2. Sign up untuk akun free
3. Verifikasi email Anda

## 2. Dapatkan Cloudinary Credentials

Setelah login, Anda akan mendapatkan:
- **Cloud Name** - Di dashboard Cloudinary
- **API Key** - Di dashboard > Settings > API Keys
- **API Secret** - Di dashboard > Settings > API Keys

## 3. Setup Environment Variables

Buat file `.env` di root project:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/yourdb

# Midtrans Configuration  
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key  
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Environment
NODE_ENV=development
PORT=3000
```

## 4. Upload Gambar Existing

Jalankan script untuk upload gambar-gambar existing:

```bash
node scripts/seed-products-cloudinary.js
```

## 5. Testing

Pastikan gambar muncul di:
- Dashboard Cloudinary (folder: `toko-bunga/produk/`)
- Website produk Anda
- API response (`/api/products`)

---

## Troubleshooting

### Error: "Must supply api_key"
Pastikan environment variables terisi dengan benar.

### Error: "Cloud name required"
Check `CLOUDINARY_CLOUD_NAME` di `.env`

### Gambar tidak muncul
- Verify API credentials
- Check console untuk error messages
- Pastikan folder permissions benar
