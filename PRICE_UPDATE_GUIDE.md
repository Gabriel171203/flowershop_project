# 💰 Cara Mengganti Harga Produk

## 🚀 **Cara Termudah: Interactive Update**

```bash
npm run update-price
```

**Contoh Interactive Session:**
```
🛠️  Interactive Price Update Tool
================================

📋 Daftar Produk Saat Ini:
========================
1. ID: 24 | Bouquet Spesial
   Harga: Rp 450.000

2. ID: 23 | Bunga Single Premium  
   Harga: Rp 150.000

3. ID: 22 | Bouquet Bunga Campur
   Harga: Rp 300.000

4. ID: 21 | Bouquet Bunga Mawar
   Harga: Rp 250.000

Masukkan ID produk yang ingin diubah harganya: 21

📦 Produk: Bouquet Bunga Mawar
💰 Harga saat ini: Rp 250.000

Masukkan harga baru: 299000

Konfirmasi update harga ke Rp 299.000? (y/n): y

✅ Berhasil update harga!
📦 Produk: Bouquet Bunga Mawar
💰 Harga baru: Rp 299.000

🎉 Harga berhasil diperbarui!
🔄 Refresh website untuk melihat perubahan.
```

---

## 📋 **Cara Lain: Batch Update**

### **1. Update Semua Harga Sekaligus**
```bash
npm run update-prices
```

**Akan mengupdate ke:**
- Bouquet Bunga Mawar: Rp 275.000
- Bouquet Bunga Campur: Rp 325.000  
- Bunga Single Premium: Rp 175.000
- Bouquet Spesial: Rp 475.000

### **2. Update via API/CURL**
```bash
# Update harga produk ID 21
curl -X PUT http://localhost:3002/api/products/21 \
  -H "Content-Type: application/json" \
  -d '{"price": 299000, "name": "Bouquet Bunga Mawar", "description": "Bouquet indah terdiri dari mawar merah segar dengan wrapping premium", "stock": 50, "category": "Bouquet"}'
```

### **3. Lihat Harga Saat Ini**
```bash
curl -s http://localhost:3002/api/products | jq '.data[] | {id, name, price}'
```

---

## 🛠️ **Custom Price Update**

Edit file `scripts/update-prices.js` untuk harga custom:

```javascript
const updates = [
  { id: 21, name: 'Bouquet Bunga Mawar', price: 350000 },      // Custom harga
  { id: 22, name: 'Bouquet Bunga Campur', price: 400000 },    // Custom harga
  { id: 23, name: 'Bunga Single Premium', price: 200000 },    // Custom harga
  { id: 24, name: 'Bouquet Spesial', price: 550000 }          // Custom harga
];
```

Kemudian jalankan:
```bash
npm run update-prices
```

---

## 🔄 **Setelah Update Harga**

1. **Refresh Website** - Update harga akan muncul langsung
2. **Check API Response** - Harga baru akan terlihat di API
3. **Verify Cart** - Keranjang akan menggunakan harga baru

---

## 📱 **Available Commands**

| Command | Description |
|---------|-------------|
| `npm run update-price` | Interactive price update (recommended) |
| `npm run update-prices` | Batch update dengan harga preset |
| `curl -X PUT ...` | Update via API endpoint |

---

**💡 Tips: Gunakan `npm run update-price` untuk cara termudah dan paling aman!**
