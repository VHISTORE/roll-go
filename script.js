let cart = [];
let personCount = 1;

// Элементы интерфейса
const cartCountElement = document.getElementById('cart-count');
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPriceElement = document.getElementById('cart-total-price');
const subtotalElement = document.getElementById('cart-subtotal');
const deliveryFeeElement = document.getElementById('display-delivery-fee');
const deliveryHeaderCost = document.getElementById('delivery-cost');
const locationSelect = document.getElementById('location-select');
const checkoutForm = document.querySelector('.checkout-form');

// Элементы управления персонами
const personMinus = document.getElementById('person-minus');
const personPlus = document.getElementById('person-plus');
const personCountDisplay = document.getElementById('person-count');

/**
 * 1. Добавление товара в корзину
 */
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        
        updateCart();

        // Анимация кнопки
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

/**
 * 2. Управление количеством персон (палочек)
 */
personPlus.addEventListener('click', () => {
    personCount++;
    personCountDisplay.innerText = personCount;
});

personMinus.addEventListener('click', () => {
    if (personCount > 1) {
        personCount--;
        personCountDisplay.innerText = personCount;
    }
});

/**
 * 3. Изменение количества товара внутри корзины
 */
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

/**
 * 4. Расчет итогов (Subtotal + Delivery)
 */
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = parseFloat(locationSelect.value) || 0;
    const total = subtotal + deliveryFee;

    if (subtotalElement) subtotalElement.innerText = `£${subtotal.toFixed(2)}`;
    if (deliveryFeeElement) deliveryFeeElement.innerText = `£${deliveryFee.toFixed(2)}`;
    if (cartTotalPriceElement) cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
    
    if (deliveryFee > 0) {
        deliveryHeaderCost.innerText = `£${deliveryFee.toFixed(2)}`;
    } else {
        deliveryHeaderCost.innerText = "Select area";
    }
}

if (locationSelect) {
    locationSelect.addEventListener('change', calculateTotal);
}

/**
 * 5. Обновление интерфейса корзины
 */
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.innerText = totalItems;
    
    if (totalItems === 0) {
        cartButton.classList.add('empty');
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        return;
    }

    cartButton.classList.remove('empty');

    cartItemsContainer.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="color: #e84118; font-weight: 800; font-size: 0.9rem;">
                    £${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
            <div class="item-controls">
                <button type="button" class="qty-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                <button type="button" class="qty-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
        </div>
    `).join('');

    calculateTotal();
}

/**
 * 6. Управление модальным окном
 */
cartButton.addEventListener('click', () => {
    if (cart.length > 0) {
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
});

closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.onclick = (event) => { 
    if (event.target == cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

/**
 * 7. Финальная отправка формы
 */
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!locationSelect.value || locationSelect.value === "") {
        alert('Please select a delivery area before confirming!');
        locationSelect.focus();
        return;
    }
    
    // Сбор данных заказа
    const selectedSauces = Array.from(document.querySelectorAll('.sauce-chip input:checked'))
        .map(input => input.parentElement.innerText.trim());
        
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    // Здесь можно сформировать объект для отправки на сервер или в телеграм
    console.log({
        items: cart,
        utensils: personCount,
        sauces: selectedSauces,
        payment: paymentMethod,
        total: cartTotalPriceElement.innerText
    });

    alert('Thank you for your order! We will contact you shortly.');
    
    // Сброс всего состояния
    cart = [];
    personCount = 1;
    personCountDisplay.innerText = "1";
    updateCart(); 
    checkoutForm.reset();
    if (locationSelect) locationSelect.value = "";
    document.body.style.overflow = 'auto';
});
