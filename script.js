let count = 0;
const countElement = document.getElementById('cart-count');
const addButtons = document.querySelectorAll('.add-to-cart');

addButtons.forEach(button => {
    button.addEventListener('click', () => {
        count++;
        countElement.innerText = count;

        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#2ed573';
        
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = '';
        }, 700);
    });
});
