/**
 * LUU'S EXCELLENCE - Unified Script
 * Handles: Supabase, Dynamic Products, Reviews, Modals, and Shopping Cart.
 */

// ⚙️ Configuration
const SUPABASE_URL = 'https://qvixtdbmxzdsrkmgehrv.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aXh0ZGJteHpkc3JrbWdlaHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjgwMTEsImV4cCI6MjA3OTY0NDAxMX0.sIljGo1502j_XubqqQ4K98MuzA5ZkXy9lVgV1qB_mzI'; 

const TABLE_REVIEWS = 'reviews';
const TABLE_PRODUCTS = 'products';
const DISPLAY_COUNT = 3; 

let supabaseClient = null;
let cart = JSON.parse(localStorage.getItem('luus_cart')) || [];

/**
 * 1. INITIALIZATION
 */
function initializeApp() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Load dynamic content
        fetchAndDisplayReviews();
        fetchAndDisplayProducts();
        
        // Refresh Cart UI on load
        updateCartUI();
    } else {
        console.error("Supabase library not loaded.");
    }
}

/**
 * 2. PRODUCT FUNCTIONS
 */

// Global Quantity Handler
window.updateQty = (id, change) => {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;

    let newVal = parseInt(input.value, 10) + change;
    if (newVal < 1) newVal = 1;

    input.value = newVal;
};

async function fetchAndDisplayProducts() {
    if (!supabase) return;

    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = '<p style="color:white; grid-column: 1/-1; text-align:center;">Loading luxury pieces...</p>';

    const { data: products, error } = await supabase
        .from(TABLE_PRODUCTS)
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        productGrid.innerHTML = '<p style="color:red; grid-column: 1/-1;">Failed to load collection.</p>';
        return;
    }

    productGrid.innerHTML = products.map(product => {
        const escapedName = product.name.replace(/'/g, "\\'");
        const escapedDesc = (product.description || "").replace(/'/g, "\\'");
        const formattedPrice = `R ${parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const productId = `p-${product.id || product.name.replace(/\s+/g, '-').toLowerCase()}`;
    
        // Color Logic
        const colors = product.colors && product.colors.length > 0 ? product.colors : [];
        const colorOptions = colors.map((color, idx) => `
            <label class="color-chip">
                <input type="radio" name="color-${productId}" value="${color}" ${idx === 0 ? 'checked' : ''}>
                <span>${color}</span>
            </label>
        `).join('');
    
        return `
            <div class="product-card">
                <div 
                    class="product-image-wrapper"
                    onclick="openModal('${escapedName}', '${formattedPrice}', '${product.image_url}', '${escapedDesc}')"
                >
                    <img src="${product.image_url}" class="product-img" alt="${product.name}">
                    <div class="product-overlay">
                        <span class="quick-view-btn">QUICK VIEW</span>
                    </div>
                </div>
    
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formattedPrice}</p>
    
                    ${colors.length > 0 ? `<div class="color-selector">${colorOptions}</div>` : ''}
    
                    <!-- Spacer pushes controls to bottom without huge gaps -->
                    <div class="controls-spacer"></div>
    
                    <div class="product-controls">
                        <div class="qty-input" onclick="event.stopPropagation()">
                            <button aria-label="Decrease" onclick="updateQty('${productId}', -1)">−</button>
                            <input type="number" id="qty-${productId}" value="1" min="1" readonly>
                            <button aria-label="Increase" onclick="updateQty('${productId}', 1)">+</button>
                        </div>
    
                        <button 
                            class="add-to-cart-btn"
                            onclick="
                                event.stopPropagation();
                                const qty = document.getElementById('qty-${productId}').value;
                                const selectedColor = document.querySelector('input[name=\\'color-${productId}\\']:checked')?.value || 'Standard';
                                addToCart('${escapedName}', '${product.price}', '${product.image_url}', qty, selectedColor);
                                document.getElementById('qty-${productId}').value = 1;
                            "
                        >
                            ADD TO BAG
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
}

/**
 * 3. CART SYSTEM
 */
function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer || !overlay) return;

    const isOpen = drawer.style.right === '0px';
    drawer.style.right = isOpen ? '-400px' : '0px';
    overlay.style.display = isOpen ? 'none' : 'block';
}

function addToCart(name, price, image, quantity = 1, color = 'Standard') {
    quantity = parseInt(quantity);
    
    // Check for identical item (same name AND same color)
    const existingItem = cart.find(item => item.name === name && item.color === color);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            name, 
            price: `R ${parseFloat(price).toFixed(2)}`, 
            image, 
            quantity,
            color
        });
    }
    
    saveCart();
    updateCartUI();
    toggleCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('luus_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    if(!cartContainer || !cartCount) return;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalQty;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: #888; margin-top:50px;">Your bag is empty.</p>';
        cartTotal.innerText = 'R 0.00';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = cart.map((item, index) => {
        const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
        total += numericPrice * item.quantity;
        
        return `
            <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center; border-bottom: 1px solid #222; padding-bottom: 15px;">
                <img src="${item.image}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px;">
                <div style="flex-grow: 1;">
                    <p style="margin: 0; font-weight: bold; font-size: 14px; color: #fff;">${item.name}</p>
                    <p style="margin: 2px 0; color: #d4af37; font-size: 11px; font-weight: bold;">COLOR: ${item.color.toUpperCase()}</p>
                    <p style="margin: 5px 0; color: #888; font-size: 13px;">${item.price} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background: none; border: none; cursor: pointer; color: #ff4444; font-size: 18px;">&times;</button>
            </div>
        `;
    }).join('');

    cartTotal.innerText = `R ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function checkout() {
    if (cart.length === 0) return alert("Your cart is empty!");
    alert("Proceeding to checkout. Thank you for shopping with LUU'S EXCELLENCE.");
}

/**
 * 4. REVIEW FUNCTIONS
 */
async function fetchAndDisplayReviews() {
    if (!supabase) return;
    const container = document.getElementById('reviewContainer');
    if (!container) return;

    const { data: reviews, error } = await supabase
        .from(TABLE_REVIEWS)
        .select('review_text, stars, user_name') 
        .order('created_at', { ascending: false });

    if (error || !reviews || reviews.length === 0) {
        container.innerHTML = '<p style="color:white;">Be the first to leave a review!</p>';
        return;
    }

    const date = new Date();
    const hourlySeed = Math.floor(date.getTime() / (1000 * 60 * 60)); 
    const startIndex = hourlySeed % reviews.length; 
    
    let rotatingReviews = [];
    for (let i = 0; i < Math.min(DISPLAY_COUNT, reviews.length); i++) {
        rotatingReviews.push(reviews[(startIndex + i) % reviews.length]);
    }

    container.innerHTML = rotatingReviews.map(review => `
        <div style="background: #111; padding: 25px; border-radius: 12px; width: 300px; border: 1px solid #222;">
            <p style="font-size: 16px; line-height: 1.6; color: #ddd;">“${review.review_text}”</p>
            <p style="margin-top: 10px; font-weight: bold; color: white;">— ${review.user_name || 'Anonymous'}</p>
            <p style="color: gold; margin-top: 5px;">${review.stars}</p>
        </div>
    `).join('');
}

/**
 * 5. UI HELPERS
 */
function openModal(name, price, imageSrc, description) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    document.getElementById('modalProductName').innerText = name;
    document.getElementById('modalProductPrice').innerText = price;
    document.getElementById('modalProductImage').src = imageSrc;
    document.getElementById('modalProductDescription').innerText = description;
    modal.style.display = 'block';

    modal.onclick = (e) => { if (e.target == modal) closeModal(); }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}
function toggleContact() {
    const contact = document.getElementById("contactDropdown");
    contact.style.display = contact.style.display === "none" ? "block" : "none";
}
// 🚀 Fire everything up
document.addEventListener('DOMContentLoaded', initializeApp);