let count = 0;
const countElement = document.getElementById('cart-count');

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        count++;
        countElement.innerText = count;

        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
        }, 800);
    });
});
