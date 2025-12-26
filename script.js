let cart = [];
const cartCountElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPriceElement = document.getElementById('cart-total-price');

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        
        cart.push({ name, price });
        updateCart();

        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        cartButton.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            button.innerText = 'Add';
            button.style.backgroundColor = '';
            cartButton.style.transform = 'scale(1)';
        }, 400);
    });
});

function updateCart() {
    const totalItems = cart.length;
    cartCountElement.innerText = totalItems;
    
    if (totalItems > 0) {
        cartButton.classList.remove('empty');
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <span>${item.name}</span>
            <b>£${item.price.toFixed(2)}</b>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
}

cartButton.addEventListener('click', () => cartModal.style.display = 'block');
closeCart.addEventListener('click', () => cartModal.style.display = 'none');
window.onclick = (event) => { if (event.target == cartModal) cartModal.style.display = 'none'; }
