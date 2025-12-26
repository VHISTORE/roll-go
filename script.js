let count = 0;
const countElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        count++;
        countElement.innerText = count;

        // 1. Убираем прозрачность корзины при первом добавлении
        if (count > 0) {
            cartButton.classList.remove('empty');
        }

        // 2. Эффект на кнопке "Add"
        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        
        // 3. Эффект прыжка
        cartButton.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
            cartButton.style.transform = 'scale(1)';
        }, 400);
    });
});
