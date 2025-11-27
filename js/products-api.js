// ============================================
// PRODUCTS API INTEGRATION
// ============================================

class ProductsAPI {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `http://${window.location.hostname}:${window.location.port}/api/products`  // Development server
            : '/api/products.js';  // Production (same domain)
        this.products = [];
        this.isLoading = false;
    }

    // Fetch all products from API
    async fetchProducts() {
        try {
            this.isLoading = true;
            this.showLoading();
            
            console.log('🌐 Fetching products from:', this.baseURL);
            
            const response = await fetch(this.baseURL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            console.log('📦 API Response:', result);
            
            if (result.status === 'success') {
                this.products = result.data;
                console.log('✅ Products loaded from API:', this.products.length, 'products');
                console.log('🖼️  Products with images:', this.products.filter(p => p.primary_image_url).length);
                return this.products;
            } else {
                throw new Error(result.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            this.showError('Gagal memuat produk. Silakan coba lagi.');
            return [];
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    // Fetch single product by ID
    async fetchProductById(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to load product');
            }
        } catch (error) {
            console.error('❌ Error fetching product:', error);
            return null;
        }
    }

    // Render products to DOM
    renderProducts(products = this.products) {
        const productGrid = document.querySelector('.grid');
        if (!productGrid) {
            console.error('❌ Product grid container not found');
            return;
        }

        // Clear existing products
        productGrid.innerHTML = '';

        if (products.length === 0) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">Belum ada produk</h3>
                    <p class="text-gray-500">Produk akan segera tersedia</p>
                </div>
            `;
            return;
        }

        products.forEach(product => {
            const productCard = this.createProductCard(product);
            productGrid.appendChild(productCard);
        });

        // Re-initialize event listeners for new products
        this.initializeProductEventListeners();
    }

    // Create product card element
    createProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300';
        card.setAttribute('data-category', product.category?.toLowerCase() || 'uncategorized');
        card.setAttribute('data-id', product.id);
        card.setAttribute('data-price', parseFloat(product.price) || 0);

        // Get primary image URL - prioritize Cloudinary URL
        const imageUrl = product.primary_image_url || product.image_url || 'https://placehold.co/300x300/ffffff/e5e5e5.png?text=No+Image';
        const altText = product.primary_image_alt || `Gambar ${product.name}`;
        
        // Get all images for gallery
        const allImages = product.images || [];
        const hasMultipleImages = allImages.length > 1;

        console.log(`🖼️  Product ${product.name}: Primary = ${imageUrl}, Total Images = ${allImages.length}`);

        // Format price
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(product.price);

        // Create image gallery HTML
        let imageGalleryHtml = '';
        if (hasMultipleImages) {
            imageGalleryHtml = `
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    <i class="fas fa-images mr-1"></i>${allImages.length} Photos
                </div>
            `;
        }

        card.innerHTML = `
            <div class="relative overflow-hidden group">
                <img src="${imageUrl}" alt="${altText}" class="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy">
                <div class="absolute top-2 left-2">
                    <span class="bg-accent text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Baru</span>
                </div>
                ${imageGalleryHtml}
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button class="quick-view bg-white rounded-full w-10 h-10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors" aria-label="Lihat detail" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="bg-white rounded-full w-10 h-10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors" aria-label="Tambah ke favorit">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 flex flex-col flex-1">
                <div class="mb-2">
                    <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">${product.category || 'Uncategorized'}</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description || 'Deskripsi produk tidak tersedia'}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xl font-bold text-primary">${formattedPrice}</span>
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-box mr-1"></i>
                        <span>Stok: ${product.stock || 0}</span>
                    </div>
                </div>
                ${hasMultipleImages ? `
                    <div class="mb-4">
                        <div class="flex gap-1 overflow-x-auto">
                            ${allImages.map((img, index) => `
                                <img src="${img.cloudinary_url}" 
                                     alt="${img.alt_text}" 
                                     class="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                     onclick="this.parentElement.parentElement.parentElement.querySelector('.relative img').src='${img.cloudinary_url}'"
                                     loading="lazy">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="product-actions bg-white border-t border-gray-100 p-3 -m-4 transform translate-y-full opacity-0 invisible transition-all duration-300">
                    <button class="add-to-cart w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-secondary transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2" 
                            data-product-id="${product.id}" 
                            data-product-name="${product.name}" 
                            data-product-price="${product.price}" 
                            data-product-category="${product.category || 'Bunga'}" 
                            data-product-image="${imageUrl}">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Tambah ke Keranjang</span>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Initialize event listeners for product cards
    initializeProductEventListeners() {
        // Re-initialize add to cart buttons
        if (typeof setupAddToCartButtons === 'function') {
            setupAddToCartButtons();
        }

        // Initialize quick view buttons
        const quickViewButtons = document.querySelectorAll('.quick-view');
        quickViewButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = button.getAttribute('data-product-id');
                await this.showQuickView(productId);
            });
        });
    }

    // Show quick view modal
    async showQuickView(productId) {
        try {
            const product = await this.fetchProductById(productId);
            if (!product) return;

            // Create or update quick view modal
            let modal = document.getElementById('quickViewModal');
            if (!modal) {
                modal = this.createQuickViewModal();
                document.body.appendChild(modal);
            }

            // Populate modal with product data
            this.populateQuickViewModal(modal, product);

            // Show modal
            modal.classList.remove('hidden');
            modal.style.display = 'flex';

        } catch (error) {
            console.error('Error showing quick view:', error);
        }
    }

    // Create quick view modal
    createQuickViewModal() {
        const modal = document.createElement('div');
        modal.id = 'quickViewModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Detail Produk</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div id="quickViewContent">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        // Add close functionality
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });

        return modal;
    }

    // Populate quick view modal with product data
    populateQuickViewModal(modal, product) {
        const content = modal.querySelector('#quickViewContent');
        
        // Get primary image
        const imageUrl = product.primary_image_url || product.image_url || 'https://placehold.co/400x400/ffffff/e5e5e5.png?text=No+Image';
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(product.price);

        // Create image gallery
        const imageGallery = product.images && product.images.length > 0 
            ? product.images.map(img => `
                <div class="carousel-item ${img.is_primary ? 'active' : ''}">
                    <img src="${img.cloudinary_url}" alt="${img.alt_text}" class="w-full h-96 object-cover">
                </div>
            `).join('')
            : `<div class="carousel-item active"><img src="${imageUrl}" alt="${product.name}" class="w-full h-96 object-cover"></div>`;

        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <div class="relative">
                        <div class="carousel relative">
                            ${imageGallery}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="mb-4">
                        <span class="text-sm font-medium text-gray-500 uppercase tracking-wider">${product.category || 'Uncategorized'}</span>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-4">${product.name}</h1>
                    <p class="text-gray-600 mb-6">${product.description || 'Deskripsi produk tidak tersedia'}</p>
                    
                    <div class="mb-6">
                        <span class="text-3xl font-bold text-primary">${formattedPrice}</span>
                    </div>
                    
                    <div class="mb-6">
                        <div class="flex items-center text-sm text-gray-500 mb-2">
                            <i class="fas fa-box mr-2"></i>
                            <span>Stok: ${product.stock || 0} tersedia</span>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah:</label>
                        <div class="flex items-center gap-4">
                            <button type="button" class="quantity-minus bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" name="quantity" value="1" min="1" max="${product.stock || 999}" class="w-20 text-center border border-gray-300 rounded-lg px-3 py-2">
                            <button type="button" class="quantity-plus bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    
                    <button class="add-to-cart w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-secondary transition-colors duration-200 font-medium flex items-center justify-center gap-2" 
                            data-product-id="${product.id}" 
                            data-product-name="${product.name}" 
                            data-product-price="${product.price}" 
                            data-product-category="${product.category || 'Bunga'}" 
                            data-product-image="${imageUrl}">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Tambah ke Keranjang</span>
                    </button>
                </div>
            </div>
        `;

        // Re-initialize add to cart functionality
        if (typeof setupAddToCartButtons === 'function') {
            setupAddToCartButtons();
        }
    }

    // Show loading indicator
    showLoading() {
        const productGrid = document.querySelector('.grid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p class="mt-4 text-gray-600">Memuat produk...</p>
                </div>
            `;
        }
    }

    // Hide loading indicator
    hideLoading() {
        // Loading will be hidden when products are rendered
    }

    // Show error message
    showError(message) {
        const productGrid = document.querySelector('.grid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h3>
                    <p class="text-gray-500 mb-4">${message}</p>
                    <button onclick="location.reload()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors">
                        <i class="fas fa-redo mr-2"></i>Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    // Filter products by category
    filterByCategory(category) {
        const filtered = category === 'all' 
            ? this.products 
            : this.products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
        
        this.renderProducts(filtered);
    }

    // Search products
    searchProducts(query) {
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description?.toLowerCase().includes(query.toLowerCase()) ||
            p.category?.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderProducts(filtered);
    }
}

// Initialize products API
const productsAPI = new ProductsAPI();

// Load products when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await productsAPI.fetchProducts();
    productsAPI.renderProducts();
});

// Make it globally available
window.productsAPI = productsAPI;
