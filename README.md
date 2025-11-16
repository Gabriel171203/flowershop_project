# Toko Bunga Indah

Toko bunga online dengan integrasi pembayaran Midtrans untuk memudahkan transaksi pelanggan.

## Fitur

- Katalog produk bunga
- Pembayaran online dengan Midtrans
- Halaman konfirmasi pembayaran
- Desain responsif
- Manajemen pesanan

## Teknologi

- HTML5, CSS3, JavaScript
- [Midtrans](https://midtrans.com/) - Gateway pembayaran
- [Vercel](https://vercel.com/) - Hosting dan deployment
- [Font Awesome](https://fontawesome.com/) - Ikon

## Cara Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/username/toko-bunga-indah.git
   cd toko-bunga-indah
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` di root direktori dan isi dengan:
   ```
   MIDTRANS_SERVER_KEY=your_server_key_here
   MIDTRANS_CLIENT_KEY=your_client_key_here
   ```

4. Jalankan pengembangan server:
   ```bash
   npm run dev
   ```

## Cara Deploy ke Vercel

1. Install Vercel CLI (jika belum terinstall):
   ```bash
   npm install -g vercel
   ```

2. Login ke Vercel:
   ```bash
   vercel login
   ```

3. Deploy proyek:
   ```bash
   vercel
   ```

4. Ikuti petunjuk di terminal untuk menyelesaikan deployment.

## Konfigurasi Midtrans

1. Daftar akun di [Midtrans](https://midtrans.com/)
2. Dapatkan API keys (Server Key dan Client Key) dari dashboard Midtrans
3. Atur callback URL di dashboard Midtrans ke `https://your-vercel-app.vercel.app/api/payment/notification`

## Struktur Folder

```
.
├── api/                    # API endpoints
│   └── payment/           # Endpoint pembayaran
│       └── token.js        # Generate token Midtrans
├── assets/                # File aset (gambar, dll)
├── css/                   # File CSS
├── js/                    # File JavaScript
├── index.html             # Halaman beranda
├── products.html          # Halaman produk
├── thank-you.html         # Halaman terima kasih
├── pending-payment.html   # Halaman pembayaran tertunda
├── vercel.json            # Konfigurasi Vercel
└── package.json           # Dependensi proyek
```

## Kontribusi

1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/namafitur`)
3. Commit perubahan Anda (`git commit -am 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buat Pull Request

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

Dikembangkan dengan ❤️ oleh [Nama Anda]
