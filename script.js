let cart = [];
const cartCountElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPriceElement = document.getElementById('cart-total-price');
const checkoutForm = document.querySelector('.checkout-form');

// 1. Add to cart logic
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        
        // Check if item already exists to increment quantity
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        
        updateCart();

        // Visual feedback on the button
        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        cartButton.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
            cartButton.style.transform = 'scale(1)';
        }, 400);
    });
});

// 2. Change quantity logic (+ / -)
window.changeQuantity = function(name, delta) {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.name !== name);
        }
        updateCart();
    }
};

// 3. Update UI
function updateCart() {
    // Update total count on the floating badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.innerText = totalItems;
    
    if (totalItems > 0) {
        cartButton.classList.remove('empty');
    } else {
        cartButton.classList.add('empty');
        cartModal.style.display = 'none'; // Close modal if last item removed
    }

    // Render items in the modal
    cartItemsContainer.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="color: #e84118; font-weight: 800; font-size: 0.9rem;">£${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
        </div>
    `).join('');

    // Update total price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
}

// 4. Modal Controls
cartButton.addEventListener('click', () => {
    if (cart.length > 0) {
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }
});

closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scroll
});

window.onclick = (event) => { 
    if (event.target == cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// 5. Form Submission
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect sauce data if needed
    const selectedSauces = Array.from(document.querySelectorAll('.sauce-chip input:checked'))
        .map(input => input.parentElement.innerText.trim());

    alert('Thank you for your order! We will contact you shortly.');
    
    // Reset cart and UI
    cart = [];
    updateCart();
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    checkoutForm.reset();
});
