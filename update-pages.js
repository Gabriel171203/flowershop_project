const fs = require('fs');
const path = require('path');

// Daftar file HTML yang perlu diupdate
const htmlFiles = [
    'about.html',
    'contact.html',
    'index.html',
    'products.html',
    'checkout.html',
    'pending-payment.html',
    'thank-you.html'
];

// Template untuk cart sidebar dan script
const cartTemplate = `
    <!-- Cart Overlay -->
    <div id="cart-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>

    <!-- Cart Sidebar -->
    <div id="cart-sidebar-placeholder">
        <!-- Cart sidebar will be loaded here -->
    </div>

    <!-- Load cart sidebar content -->
    <script>
        // Load cart sidebar
        document.addEventListener('DOMContentLoaded', function() {
            fetch('/cart-sidebar.html')
                .then(response => response.text())
                .then(html => {
                    const placeholder = document.getElementById('cart-sidebar-placeholder');
                    if (placeholder) {
                        placeholder.innerHTML = html;
                        // Initialize cart functionality
                        if (typeof initCart === 'function') {
                            initCart();
                        }
                    }
                });
        });
    </script>
`;

// Fungsi untuk menambahkan kode ke file HTML
function updateHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Cek apakah sudah ada cart-sidebar-placeholder
        if (content.includes('cart-sidebar-placeholder')) {
            console.log(`Skipping ${filePath} - already has cart sidebar`);
            return;
        }
        
        // Temukan posisi sebelum penutup body
        const bodyEndTag = '</body>';
        const bodyEndIndex = content.lastIndexOf(bodyEndTag);
        
        if (bodyEndIndex === -1) {
            console.log(`Skipping ${filePath} - no </body> tag found`);
            return;
        }
        
        // Sisipkan kode sebelum penutup body
        const newContent = content.substring(0, bodyEndIndex) + 
                         '\n    ' + cartTemplate.trim().split('\n').join('\n    ') + 
                         '\n' + content.substring(bodyEndIndex);
        
        // Tulis kembali file
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
    }
}

// Jalankan update untuk semua file
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        updateHtmlFile(filePath);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});

console.log('\nUpdate selesai! Pastikan file cart-sidebar.html ada di direktori root.');
