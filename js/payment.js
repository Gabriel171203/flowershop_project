import { paymentService } from './services/paymentService.js';

// Function to handle payment
async function handlePayment(product, paymentType) {
    console.log('handlePayment called with:', { 
        product, 
        paymentType,
        element: product.element // Log elemen untuk debugging
    });
    
    try {
        // Tampilkan loading indicator
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Validasi produk dan harga
        if (!product || !product.id || !product.name) {
            throw new Error('Produk tidak valid. Harap pilih produk yang tersedia.');
        }
        
        // Pastikan harga valid dan lebih dari 0
        const price = parseFloat(product.price);
        if (isNaN(price) || price <= 0) {
            const errorMsg = `Harga produk tidak valid: ${product.price}. Harap periksa kembali harga produk.`;
            console.error(errorMsg, {
                product,
                parsedPrice: price,
                element: product.element?.outerHTML
            });
            throw new Error(errorMsg);
        }
        
        // Perbarui harga produk dengan nilai yang sudah diparsing
        product.price = price;

        // Dapatkan data pelanggan dari form
        const customerName = document.getElementById('customer-name')?.value?.trim() || '';
        const customerEmail = document.getElementById('customer-email')?.value?.trim() || '';
        const customerPhone = document.getElementById('customer-phone')?.value?.trim() || '';
        const customerAddress = document.getElementById('customer-address')?.value?.trim() || '';

        // Validasi data pelanggan
        const errors = [];
        if (!customerName) errors.push('Nama lengkap harus diisi');
        if (!customerEmail) {
            errors.push('Email harus diisi');
        } else {
            // Validasi format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
                errors.push('Format email tidak valid');
            }
        }
        
        if (!customerPhone) errors.push('Nomor telepon harus diisi');
        if (!customerAddress) errors.push('Alamat harus diisi');
        
        if (errors.length > 0) {
            // Tampilkan semua error sekaligus
            alert(errors.join('\n'));
            return; // Hentikan proses jika ada error
        }

        // Validasi nomor telepon (minimal 10 digit, maksimal 15 digit, hanya angka dan tanda + - spasi)
        const phoneRegex = /^[0-9+\-\s]{10,15}$/;
        if (!phoneRegex.test(customerPhone)) {
            throw new Error('Nomor telepon harus terdiri dari 10-15 digit angka, boleh menggunakan tanda + atau -');
        }

        // Siapkan data transaksi untuk Midtrans
        const order = {
            transaction_details: {
                order_id: `ORDER-${Date.now()}`,
                gross_amount: parseInt(product.price)
            },
            item_details: [{
                id: product.id,
                price: parseInt(product.price),
                quantity: 1,
                name: product.name.substring(0, 50),
                category: 'Bunga',
                merchant_name: 'FlowerShop Indah'
            }],
            customer_details: {
                first_name: customerName,
                email: customerEmail,
                phone: customerPhone,
                billing_address: {
                    first_name: customerName,
                    address: customerAddress || 'Jl. Bunga Indah No. 123',
                    city: 'Jakarta',
                    postal_code: '12345',
                    phone: customerPhone,
                    country_code: 'IDN'
                }
            },
            // Pengaturan pembayaran
            payment_type: 'qris', // Default ke QRIS, bisa diganti sesuai pilihan user
            // Aktifkan metode pembayaran yang didukung
            enabled_payments: [
                'credit_card',
                'gopay',
                'qris',
                'shopeepay',
                'bank_transfer',
                'bca_klikbca',
                'bca_klikpay',
                'bri_epay',
                'cimb_clicks',
                'danamon_online',
                'echannel',
                'permata_va',
                'bca_va',
                'bni_va',
                'bri_va',
                'other_va',
                'indomaret',
                'alfamart',
                'akulaku'
            ],
            // Pengaturan khusus untuk QRIS
            qris: {
                acquirer: 'gopay' // atau 'shopee' tergantung preferensi
            },
            // Pengaturan untuk bank transfer
            bank_transfer: {
                bank: 'bca',
                va_number: '1234567890',
                bca: {
                    sub_company_code: '00000'
                },
                permata: {
                    recipient_name: 'Toko Bunga Indah'
                }
            },
            // Pengaturan untuk credit card
            credit_card: {
                secure: true,
                save_card: false,
                channel: 'migs',
                bank: 'bca',
                installment: {
                    required: false,
                    terms: {
                        bni: [3, 6, 12],
                        mandiri: [3, 6, 12],
                        cimb: [3, 6],
                        bca: [3, 6, 12],
                        maybank: [3, 6, 12],
                        bri: [3, 6, 12],
                        offline: [3, 6, 12]
                    }
                },
                whitelist_bins: []
            },
            // Callback URLs
            callbacks: {
                finish: `${window.location.origin}/thank-you.html`,
                error: `${window.location.origin}/payment-failed.html`,
                pending: `${window.location.origin}/pending-payment.html`
            }
        };

        // Simpan data pelanggan ke localStorage
        saveCustomerData({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress
        });

        // Tampilkan loading
        console.log('Memproses pembayaran...');

        try {
            // Panggil paymentService untuk memproses pembayaran
            const paymentResult = await paymentService.processPayment(order);
            
            console.log('Payment result:', paymentResult);
            
            // Jika berhasil, arahkan ke halaman sukses
            if (paymentResult && paymentResult.redirect_url) {
                window.location.href = paymentResult.redirect_url;
            } else if (paymentResult && paymentResult.token) {
                // Jika menggunakan Snap, redirect_url akan dihandle oleh Snap
                console.log('Payment token generated, opening payment gateway...');
            } else {
                throw new Error('Tidak dapat memproses pembayaran. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error during payment processing:', error);
            throw new Error(`Gagal memproses pembayaran: ${error.message || 'Silakan coba lagi'}`);
        } finally {
            // Pastikan loading indicator selalu disembunyikan
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification(`Pembayaran gagal: ${error.message}`, 'error');
    }
}

// Function to save customer data to localStorage
function saveCustomerData(data) {
    try {
        localStorage.setItem('customerData', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving customer data:', error);
        return false;
    }
}

// Function to load customer data from localStorage
function loadCustomerData() {
    try {
        const data = localStorage.getItem('customerData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading customer data:', error);
        return null;
    }
}

// Function to handle form submission
function handleCustomerFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const customerData = {
        name: formData.get('customer-name') || '',
        email: formData.get('customer-email') || '',
        phone: formData.get('customer-phone') ? `+62${formData.get('customer-phone')}` : '',
        address: formData.get('customer-address') || '',
        saveInfo: formData.get('save-info') === 'on'
    };

    // Save to localStorage if user opted in
    if (customerData.saveInfo) {
        saveCustomerData(customerData);
    } else {
        localStorage.removeItem('customerData');
    }

    // Show success message
    showNotification('Data pelanggan berhasil disimpan!', 'success');
    
    // Scroll to payment section if needed
    document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
}

// Function to initialize customer form
function initCustomerForm() {
    const form = document.getElementById('customer-data-form');
    const resetBtn = document.getElementById('reset-form');
    
    if (!form) return;
    
    // Load saved data if exists
    const savedData = loadCustomerData();
    if (savedData) {
        form['customer-name'].value = savedData.name || '';
        form['customer-email'].value = savedData.email || '';
        form['customer-phone'].value = savedData.phone.replace('+62', '') || '';
        form['customer-address'].value = savedData.address || '';
        form['save-info'].checked = true;
    }
    
    // Add form submit handler
    form.addEventListener('submit', handleCustomerFormSubmit);
    
    // Add reset button handler
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            localStorage.removeItem('customerData');
        });
    }
}

// Function to add payment buttons to product cards
function addPaymentButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
        // Dapatkan harga dari elemen harga produk
        const getPriceFromElement = () => {
            // Coba dapatkan dari elemen dengan class 'price' di dalam product-info
            const priceElement = card.querySelector('.product-info .price') || 
                               card.querySelector('.price') ||
                               card.querySelector('[data-price]');
            
            if (!priceElement) {
                console.warn('Price element not found for product:', card.querySelector('h3')?.textContent);
                return 0;
            }
            
            // Dapatkan teks harga dan bersihkan
            let priceText = priceElement.textContent || priceElement.value || '0';
            priceText = priceText.replace(/[^0-9,]/g, '').replace(',', '.');
            
            const price = parseFloat(priceText);
            return isNaN(price) ? 0 : price;
        };
        
        const product = {
            id: card.dataset.id || `prod-${Math.random().toString(36).substr(2, 9)}`,
            name: card.querySelector('h3')?.textContent?.trim() || 'Produk',
            price: getPriceFromElement(),
            element: card // Simpan referensi ke elemen untuk debugging
        };
        
        console.log('Product data:', product);

        // Add payment buttons to product actions
        const productActions = card.querySelector('.product-actions') || document.createElement('div');
        if (!card.querySelector('.product-actions')) {
            productActions.className = 'product-actions';
            card.querySelector('.product-info').appendChild(productActions);
        }

        // Add payment buttons
        console.log('Adding payment buttons for product:', product.name);
        const paymentMethods = [
            { type: 'qris', label: 'QRIS', icon: 'fa-qrcode' },
            { type: 'bank_transfer', label: 'Transfer Bank', icon: 'fa-university' },
            { type: 'credit_card', label: 'Kartu Kredit', icon: 'fa-credit-card' }
        ];
        console.log('Available payment methods:', paymentMethods);

        paymentMethods.forEach(method => {
            const btn = document.createElement('button');
            btn.className = `btn-payment ${method.type}`;
            btn.innerHTML = `<i class="fas ${method.icon}"></i> ${method.label}`;
            btn.onclick = (e) => {
                console.log('Button clicked:', method.type, 'for product:', product.name);
                e.preventDefault();
                e.stopPropagation(); // Mencegah event bubbling
                try {
                    handlePayment(product, method.type);
                } catch (error) {
                    console.error('Error in button click handler:', error);
                }
            };
            productActions.appendChild(btn);
        });
    });
}

// Fungsi untuk memastikan DOM sudah sepenuhnya dimuat
function initializePaymentButtons() {
    // Coba jalankan langsung
    addPaymentButtons();
    
    // Jika tidak ada tombol yang terdeteksi, coba lagi setelah delay
    setTimeout(() => {
        if (document.querySelectorAll('.btn-payment').length === 0) {
            console.log('No payment buttons found, retrying...');
            addPaymentButtons();
        }
    }, 1000);
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    initializePaymentButtons();
    initCustomerForm();
});

// Juga coba inisialisasi jika konten dimuat secara dinamis
document.addEventListener('DOMContentLoaded', () => {
    // Gunakan MutationObserver untuk mendeteksi perubahan pada DOM
    const observer = new MutationObserver((mutations) => {
        if (document.querySelector('.product-card') && !document.querySelector('.btn-payment')) {
            console.log('New products detected, adding payment buttons...');
            addPaymentButtons();
        }
    });
    
    // Mulai mengamati perubahan pada body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Hapus ekspor showQRIS karena tidak digunakan
// Fungsi ini akan diimplementasikan nanti jika diperlukan
