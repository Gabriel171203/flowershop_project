// Nomor WhatsApp admin (format: 6281234567890)
const ADMIN_WHATSAPP = '6281214168584';

// Fungsi untuk menampilkan QRIS Gopay
function showQRIS(product) {
    // Ganti dengan URL gambar QRIS Gopay Anda
    const QRIS_IMAGE_URL = "gambar_qris_flower.jpeg";
    
    // Format pesan WhatsApp
    const message = `Halo admin, saya sudah melakukan pembayaran untuk produk:
    
Nama Produk: ${product.name}
Harga: Rp ${product.price.toLocaleString('id-ID')}

Berikut bukti pembayarannya.`;
    
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    
    const qrisModal = `
        <div id="qrisModal" class="modal" style="display: flex;">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Pembayaran QRIS</h3>
                <div class="qris-code">
                    <img src="${QRIS_IMAGE_URL}" alt="QRIS Gopay" style="max-width: 250px;">
                </div>
                <div class="payment-instructions">
                    <p><strong>Cara Pembayaran:</strong></p>
                    <ol style="text-align: left; margin: 10px 20px;">
                        <li>Buka aplikasi Gopay di ponsel Anda</li>
                        <li>Pilih 'Scan QRIS'</li>
                        <li>Arahkan kamera ke kode QR di atas</li>
                        <li>Masukkan nominal: <strong>Rp ${product.price.toLocaleString('id-ID')}</strong></li>
                        <li>Selesaikan pembayaran</li>
                    </ol>
                    <p>Setelah melakukan pembayaran, harap konfirmasi dengan mengklik tombol di bawah ini:</p>
                </div>
                <a href="${whatsappUrl}" class="whatsapp-btn" target="_blank">
                    <i class="fab fa-whatsapp"></i> Konfirmasi Pembayaran via WhatsApp
                </a>
                <button class="close-btn" onclick="document.getElementById('qrisModal').remove()">Tutup</button>
            </div>
        </div>
    `;
    
    // Hapus modal sebelumnya jika ada
    const existingModal = document.getElementById('qrisModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Tambahkan modal baru
    document.body.insertAdjacentHTML('beforeend', qrisModal);
    
    // Tambahkan event listener untuk tombol close
    document.querySelector('#qrisModal .close').addEventListener('click', function() {
        document.getElementById('qrisModal').remove();
    });
    
    // Tutup modal saat mengklik di luar konten
    document.querySelector('#qrisModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// Fungsi untuk menambahkan tombol bayar dengan QRIS ke produk
function addQRISButtons() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent;
        const priceText = card.querySelector('.price').textContent;
        const price = parseInt(priceText.replace(/[^0-9]/g, ''));
        
        const qrisButton = document.createElement('button');
        qrisButton.className = 'btn-qris';
        qrisButton.innerHTML = '<i class="fas fa-qrcode"></i> Bayar dengan QRIS';
        qrisButton.onclick = () => showQRIS({
            name: productName,
            price: price
        });
        
        const actions = card.querySelector('.product-actions');
        if (actions) {
            actions.appendChild(qrisButton);
        }
    });
}

// Inisialisasi saat dokumen siap
document.addEventListener('DOMContentLoaded', addQRISButtons);
