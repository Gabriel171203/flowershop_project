// Format rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Get cart items from localStorage
function getCartItems() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        return cart.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity) || 1,
            category: item.category || 'Bunga'
        }));
    } catch (error) {
        console.error('Error getting cart items:', error);
        return [];
    }
}

// Update order summary
function updateOrderSummary() {
    const cartItems = getCartItems();
    const orderSummary = document.getElementById('order-summary');
    const orderTotal = document.getElementById('order-total');
    let total = 0;

    // Clear existing items
    orderSummary.innerHTML = '';

    // Add each item to the summary
    cartItems.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center py-2 border-b border-gray-100';
        itemElement.innerHTML = `
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-600">${item.quantity} x ${formatRupiah(item.price)}</p>
            </div>
            <span class="font-medium">${formatRupiah(subtotal)}</span>
        `;
        orderSummary.appendChild(itemElement);
    });

    // Update total
    if (orderTotal) {
        orderTotal.textContent = formatRupiah(total);
    }
}

// Add to cart function
function addToCart(productId, productName, price, category = 'Bunga') {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1,
            category: category
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateOrderSummary();
    
    // Show success message
    showAlert(`${productName} telah ditambahkan ke keranjang`);
}

// Handle order submission
async function submitOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('#submit-order-btn');
    const loadingSpinner = submitBtn.querySelector('#loading-spinner');
    const submitText = submitBtn.querySelector('span');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        submitText.textContent = 'Memproses...';

        // Get form data
        const formData = {
            customer_name: document.getElementById('customer-name').value.trim(),
            customer_email: document.getElementById('customer-email').value.trim(),
            customer_phone: document.getElementById('customer-phone').value.trim(),
            items: getCartItems()
        };

        // Validate form data
        if (!formData.customer_name || !formData.customer_email || !formData.customer_phone) {
            throw new Error('Harap isi semua field yang wajib diisi');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
            throw new Error('Format email tidak valid');
        }

        if (formData.items.length === 0) {
            throw new Error('Keranjang belanja Anda kosong');
        }

        // Submit order to backend
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memproses pesanan');
        }

        // Redirect to payment page
        if (result.data?.payment_url) {
            window.location.href = result.data.payment_url;
        } else {
            window.location.href = '/thank-you.html';
        }

    } catch (error) {
        console.error('Order submission error:', error);
        showAlert(error.message || 'Terjadi kesalahan saat memproses pesanan', 'error');
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        submitText.textContent = 'Lanjut ke Pembayaran';
    }
}

// Helper function to show alert messages
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
    type === 'error' ? 'bg-red-500' : 'bg-green-500'
  } text-white`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  // Remove alert after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Initialize order form
function initOrderForm() {
  const orderForm = document.getElementById('customer-data-form');
  if (orderForm) {
    orderForm.addEventListener('submit', submitOrder);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize order form
    const orderForm = document.getElementById('customer-data-form');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }
    
    // Initialize mobile menu
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && !mobileMenu.contains(event.target) && 
            mobileMenuButton && !mobileMenuButton.contains(event.target)) {
            mobileMenu.classList.add('hidden');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Initialize add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const card = button.closest('.product-card');
            const productId = card.dataset.id || Date.now().toString();
            const productName = card.querySelector('.product-title')?.textContent || 'Produk';
            const price = parseFloat(card.dataset.price) || 0;
            const category = card.dataset.category || 'Bunga';
            
            addToCart(productId, productName, price, category);
        });
    });
    
    // Initialize order summary
    updateOrderSummary();
});

// Function to get cart items (implement this based on your cart system)
function getCartItems() {
  // This is a placeholder - implement based on your cart system
  const cartItems = [];
  const productElements = document.querySelectorAll('.product-item');
  
  productElements.forEach(item => {
    if (item.dataset.id && item.dataset.quantity > 0) {
      cartItems.push({
        id: item.dataset.id,
        name: item.dataset.name || 'Product',
        price: parseFloat(item.dataset.price) || 0,
        quantity: parseInt(item.dataset.quantity) || 1,
        category: item.dataset.category || 'Bunga'
      });
    }
  });
  
  return cartItems;
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