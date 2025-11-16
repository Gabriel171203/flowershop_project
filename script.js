function pesan(namaProduk) {
  alert("Terima kasih telah memesan " + namaProduk + "! Kami akan segera memproses pesanan Anda.");
}

function kirimPesan() {
  const nama = document.getElementById("nama").value;
  const email = document.getElementById("email").value;
  const pesan = document.getElementById("pesan").value;

  if (nama && email && pesan) {
    alert("Terima kasih, " + nama + "! Pesan Anda telah dikirim.");
    return false; // biar tidak reload halaman
  } else {
    alert("Harap isi semua kolom sebelum mengirim pesan.");
    return false;
  }
}

// Fungsi untuk menangani klik tombol pesan custom
function pesanBuketCustom() {
  // Redirect ke halaman kontak atau halaman khusus pemesanan custom
  window.location.href = 'contact.html?pesan=buket-custom';
  return false;
}

// Fungsi untuk membuka chat WhatsApp dengan format pesan custom
function chatAdminCustom(event) {
  // Cek jika event ada, cegah default behavior
  if (event) {
    event.preventDefault();
  }
  
  const adminNumber = '6281214168584'; // Nomor WhatsApp admin
  
  // Format pesan sesuai permintaan
  const message = `Halo admin, saya ingin memesan buket custom dengan detail sebagai berikut:%0A%0A` +
                 `Tipe Bahan: %0A` +
                 `Jumlah Tangkai: %0A` +
                 `Bentuk: %0A` +
                 `Warna: %0A%0A` +
                 `Terima kasih.`;
  
  // Buka WhatsApp dengan pesan
  window.open(`https://wa.me/${adminNumber}?text=${message}`, '_blank');
  return false;
}

// Inisialisasi event listener untuk tombol pesan custom
document.addEventListener('DOMContentLoaded', function() {
  const customOrderBtns = document.querySelectorAll('.product-card[data-category="custom"] .add-to-cart');
  
  customOrderBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      pesanBuketCustom();
    });
  });
});