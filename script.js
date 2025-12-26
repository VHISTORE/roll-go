let count = 0;
const countElement = document.getElementById('cart-count');
const addButtons = document.querySelectorAll('.add-to-cart');

addButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Increase cart count
        count++;
        countElement.innerText = count;

        // Visual feedback
        const originalText = button.innerText;
        button.innerText = 'Added! ✓';
        button.style.backgroundColor = 'var(--success-color)';
        button.disabled = true;

        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = 'var(--primary-color)';
            button.disabled = false;
        }, 800);

        // Log for debugging
        console.log(`Item added: ${button.getAttribute('data-name')}`);
    });
});
