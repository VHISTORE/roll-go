let count = 0;
const cart = [];
const countElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');

// Добавление в корзину
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        count++;
        countElement.innerText = count;
        cartButton.classList.remove('empty');

        // Эффект кнопки
        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        cartButton.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
            cartButton.style.transform = 'scale(1)';
        }, 400);
    });
});

// Открыть корзину
cartButton.addEventListener('click', () => {
    if (count > 0) {
        cartModal.style.display = 'block';
    }
});

// Закрыть корзину
closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

// Закрытие по клику вне окна
window.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.style.display = 'none';
});
