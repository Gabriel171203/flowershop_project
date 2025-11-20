// products.js - Product page specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Product filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            productCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    // Add animation class when showing cards
                    card.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Initialize add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = button.closest('.product-card');
            const productId = productCard.getAttribute('data-id') || 'prod-' + Math.random().toString(36).substr(2, 9);
            const productName = productCard.querySelector('.product-title')?.textContent || 'Produk';
            const productPrice = parseFloat(productCard.getAttribute('data-price') || '0');
            
            // Add to cart
            addToCart(productId, productName, productPrice);
            
            // Show success message
            showNotification(`"${productName}" telah ditambahkan ke keranjang!`);
        });
    });

    // Handle Buy Now buttons
    const buyNowButtons = document.querySelectorAll('.buy-now');
    
    buyNowButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Show loading overlay
            document.getElementById('loadingOverlay').style.display = 'flex';
            
            // Get product details from data attributes
            const productCard = button.closest('.product-card');
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseInt(button.getAttribute('data-product-price'));
            
            // Prepare order data
            const orderData = {
                transaction_details: {
                    order_id: 'ORDER-' + new Date().getTime(),
                    gross_amount: productPrice
                },
                item_details: [
                    {
                        id: productId,
                        price: productPrice,
                        quantity: 1,
                        name: productName
                    }
                ],
                customer_details: {
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: ''
                },
                credit_card: {
                    secure: true
                }
            };
            
            // Store order data in localStorage to be used in the payment page
            localStorage.setItem('currentOrder', JSON.stringify(orderData));
            
            // Redirect to payment page
            window.location.href = 'checkout.html';
            
            // For direct payment processing (uncomment if you want to process payment directly)
            /*
            const paymentService = new PaymentService();
            paymentService.processPayment(orderData)
                .then(() => {
                    // Hide loading overlay on success
                    document.getElementById('loadingOverlay').style.display = 'none';
                })
                .catch(error => {
                    console.error('Payment error:', error);
                    alert('Pembayaran gagal: ' + error.message);
                    document.getElementById('loadingOverlay').style.display = 'none';
                });
            */
        });
    });
    
    // Quick view functionality
    const quickViewButtons = document.querySelectorAll('.quick-view');
    
    quickViewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = button.closest('.product-card');
            const productName = productCard.querySelector('h3')?.textContent || 'Produk';
            const productPrice = productCard.querySelector('.price')?.textContent || 'Rp 0';
            
            // Here you would typically show a modal with more product details
            alert(`Quick View: ${productName}\nHarga: ${productPrice}\n\nFitur ini akan menampilkan detail produk yang lebih lengkap.`);
        });
    });

    // Pagination
    const pageNumbers = document.querySelectorAll('.page-number');
    const paginationPrev = document.querySelector('.pagination-btn:first-child');
    const paginationNext = document.querySelector('.pagination-btn:last-child');
    
    if (pageNumbers.length > 0) {
        // Initialize first page as active if none is active
        if (!document.querySelector('.page-number.active')) {
            pageNumbers[0]?.classList.add('active');
        }
        
        // Update pagination buttons state
        const updatePaginationState = () => {
            const activePage = document.querySelector('.page-number.active');
            if (!activePage) return;
            
            const currentPage = parseInt(activePage.textContent);
            const totalPages = pageNumbers.length;
            
            if (paginationPrev) {
                paginationPrev.disabled = currentPage === 1;
            }
            
            if (paginationNext) {
                paginationNext.disabled = currentPage === totalPages;
            }
            
            // Here you would typically load the corresponding page of products
            console.log(`Loading page ${currentPage}...`);
        };
        
        // Page number click
        pageNumbers.forEach(number => {
            number.addEventListener('click', (e) => {
                e.preventDefault();
                pageNumbers.forEach(n => n.classList.remove('active'));
                number.classList.add('active');
                updatePaginationState();
            });
        });
        
        // Previous/Next pagination
        if (paginationPrev) {
            paginationPrev.addEventListener('click', (e) => {
                e.preventDefault();
                if (paginationPrev.disabled) return;
                
                const activePage = document.querySelector('.page-number.active');
                const prevPage = activePage?.previousElementSibling;
                
                if (prevPage && prevPage.classList.contains('page-number')) {
                    prevPage.click();
                }
            });
        }
        
        if (paginationNext) {
            paginationNext.addEventListener('click', (e) => {
                e.preventDefault();
                if (paginationNext.disabled) return;
                
                const activePage = document.querySelector('.page-number.active');
                const nextPage = activePage?.nextElementSibling;
                
                if (nextPage && nextPage.classList.contains('page-number')) {
                    nextPage.click();
                } else if (nextPage?.nextElementSibling?.classList.contains('page-number')) {
                    nextPage.nextElementSibling.click();
                }
            });
        }
        
        // Initial state
        updatePaginationState();
    }
    
    // Initialize animations
    const animateProducts = () => {
        const products = document.querySelectorAll('.product-card');
        products.forEach((card, index) => {
            // Set initial state
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            // Add a small delay for each card for staggered animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
        });
    };
    
    // Run animation on page load
    animateProducts();
    
    // Also run animation when the page is fully loaded
    window.addEventListener('load', animateProducts);
    
    // Run animation when the page becomes visible again (e.g., when coming back from another tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            animateProducts();
        }
    });
});
