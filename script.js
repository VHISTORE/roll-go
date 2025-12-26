let count = 0;
const countElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        count++;
        countElement.innerText = count;

        // Эффект на кнопке карточки
        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        
        // Эффект "прыжка" корзины
        cartButton.style.transform = 'scale(1.3) rotate(-10deg)';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
            cartButton.style.transform = '';
        }, 400);
    });
});
