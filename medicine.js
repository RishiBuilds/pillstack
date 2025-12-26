const state = {
    cart: JSON.parse(localStorage.getItem('pillstack_cart') || '[]'),
    medicines: [],
    category: 'all',
    sort: 'name-asc'
};

const el = {};

function init() {
    console.log('Initializing...');
    
    // Cache DOM elements
    el.grid = document.getElementById('medGrid');
    el.cartItems = document.getElementById('cartItems');
    el.cartTotal = document.getElementById('cartTotal');
    el.cartCount = document.getElementById('cartCount');
    el.cartSidebar = document.getElementById('cartSidebar');
    el.cartToggle = document.getElementById('cartToggle');
    el.closeCart = document.getElementById('closeCart');
    el.search = document.getElementById('medSearch');
    el.searchBtn = document.getElementById('searchBtn');
    el.sortSelect = document.getElementById('sortSelect');
    el.checkoutBtn = document.getElementById('checkoutBtn');

    // event listener
    setupEvents();
    
    // Load's data
    updateCartUI();
    fetchMedicines();
}

// Event Listeners
function setupEvents() {
    // Cart controls
    el.cartToggle?.addEventListener('click', () => el.cartSidebar.classList.add('active'));
    el.closeCart?.addEventListener('click', () => el.cartSidebar.classList.remove('active'));
    
    // Search
    el.searchBtn?.addEventListener('click', () => fetchMedicines(el.search.value));
    el.search?.addEventListener('keyup', e => {
        if (e.key === 'Enter') fetchMedicines(el.search.value);
    });
    
    // Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.category = chip.dataset.category;
            applyFilters();
        });
    });
    
    // Sort
    el.sortSelect?.addEventListener('change', () => {
        state.sort = el.sortSelect.value;
        applyFilters();
    });
    
    // Checkout
    el.checkoutBtn?.addEventListener('click', handleCheckout);
    
    console.log('Events ready');
}

// Fetches Medicines
async function fetchMedicines(query = '') {
    if (!el.grid) return;
    
    el.grid.innerHTML = '<div class="loading">Loading medicines...</div>';
    
    // Wait's for Supabase
    if (!await waitForSupabase()) {
        el.grid.innerHTML = '<div class="error">Unable to connect. Please refresh.</div>';
        return;
    }
    
    try {
        let dbQuery = window.supabaseClient.from('medicines').select('*');
        
        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
        }

        const { data, error } = await dbQuery;

        if (error) {
            console.error('Database error:', error);
            el.grid.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            return;
        }

        if (!data?.length) {
            el.grid.innerHTML = '<div class="no-results">No medicines found.</div>';
            state.medicines = [];
        } else {
            console.log(`Loaded ${data.length} medicines`);
            state.medicines = data;
            applyFilters();
        }
    } catch (err) {
        console.error('Error:', err);
        el.grid.innerHTML = '<div class="error">An error occurred. Please refresh.</div>';
    }
}

// Wait's for Supabase client
async function waitForSupabase(maxRetries = 20) {
    let retries = 0;
    while (!window.supabaseClient && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }
    return !!window.supabaseClient;
}

// Applies Filters and Sort
function applyFilters() {
    let filtered = [...state.medicines];
    
    // Filter by category
    if (state.category !== 'all') {
        filtered = filtered.filter(m => m.category === state.category);
    }
    
    // Sort
    filtered.sort((a, b) => {
        switch(state.sort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            default: return 0;
        }
    });
    
    displayMedicines(filtered);
}

// Display Medicines
function displayMedicines(medicines) {
    if (!el.grid || !medicines?.length) {
        el.grid.innerHTML = '<div class="no-results">No medicines match your criteria.</div>';
        return;
    }

    el.grid.innerHTML = medicines.map(m => `
        <div class="med-card">
            <div class="med-image">
                <img src="${m.image_url || 'https://via.placeholder.com/200'}" 
                     alt="${m.name}" 
                     onerror="this.src='https://via.placeholder.com/200'">
                <span class="category">${m.category}</span>
            </div>
            <div class="med-info">
                <h3>${m.name}</h3>
                <p>${m.description || 'No description available'}</p>
                <div class="med-footer">
                    <span class="price">₹${m.price.toFixed(2)}</span>
                    <button class="btn-add" 
                            onclick="addToCart('${m.id}', '${escapeHtml(m.name)}', ${m.price}, ${!!m.requires_prescription})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Escape HTML for security
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add to Cart
async function addToCart(id, name, price, requiresPrescription = false) {
    // Check prescription requirement
    if (requiresPrescription) {
        const hasAccess = await checkPrescriptionAccess();
        if (!hasAccess) return;
    }

    // Add or update cart
    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ id, name, price, quantity: 1, requiresPrescription });
    }
    
    updateCartUI();
    
    // Show feedback
    if (window.showToast) {
        showToast(`${name} added to cart`);
    } else {
        el.cartSidebar?.classList.add('active');
    }
}

// Check Prescription Access
async function checkPrescriptionAccess() {
    if (!window.supabaseClient) {
        showToast('Please wait for the system to load.', 'error');
        return false;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session?.user) {
        if (window.showConfirmModal) {
            return new Promise(resolve => {
                showConfirmModal(
                    'Login Required',
                    'You need to login to purchase prescription medicines.',
                    () => {
                        window.location.href = 'login.html';
                        resolve(false);
                    }
                );
            });
        }
        alert('Please login to purchase prescription medicines.');
        window.location.href = 'login.html';
        return false;
    }

    const { data: prescriptions } = await window.supabaseClient
        .from('prescriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'approved');

    if (!prescriptions?.length) {
        if (window.showConfirmModal) {
            return new Promise(resolve => {
                showConfirmModal(
                    'Prescription Required',
                    'This item requires a valid prescription. Would you like to upload one now?',
                    () => {
                        window.location.href = 'prescription.html';
                        resolve(false);
                    }
                );
            });
        }
        if (confirm('This requires a prescription. Upload one now?')) {
            window.location.href = 'prescription.html';
        }
        return false;
    }
    
    return true;
}

// Update Cart UI
function updateCartUI() {
    if (!el.cartCount || !el.cartItems || !el.cartTotal) return;
    
    // Update count
    el.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update items
    el.cartItems.innerHTML = state.cart.length ? state.cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${window.formatCurrency ? formatCurrency(item.price) : '₹' + item.price.toFixed(2)} × ${item.quantity}</p>
            </div>
            <div class="item-actions">
                <button onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease" class="btn-qty">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', 1)" aria-label="Increase" class="btn-qty">+</button>
                <button onclick="removeFromCart('${item.id}')" aria-label="Remove" class="btn-remove"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('') : '<div class="no-results">Cart is empty</div>';

    // Update total
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    el.cartTotal.textContent = window.formatCurrency ? formatCurrency(total) : `₹${total.toFixed(2)}`;
    
    // Save to localStorage
    saveCart();
}

// Update Quantity
function updateQuantity(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.id !== id);
    }
    
    updateCartUI();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    updateCartUI();
}

// Save Cart
function saveCart() {
    localStorage.setItem('pillstack_cart', JSON.stringify(state.cart));
}

// Handle Checkout
async function handleCheckout() {
    if (!window.supabaseClient) {
        showToast('Please wait for the system to load.', 'error');
        return;
    }
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session?.user) {
        if (window.showConfirmModal) {
            showConfirmModal(
                'Login Required', 
                'Please login to complete your purchase.',
                () => window.location.href = 'login.html'
            );
        } else {
            alert('Please login to checkout');
            window.location.href = 'login.html';
        }
        return;
    }
    
    if (!state.cart.length) {
        showToast('Your cart is empty', 'error');
        return;
    }

    saveCart();
    window.location.href = 'checkout.html';
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}