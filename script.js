let count = 0;
const countDisplay = document.getElementById('cart-count');

document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        count++;
        countDisplay.innerText = count;
        
        // Маленький эффект клика
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = 'scale(1)', 100);
    });
});
