let cart = [];

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

/**
 * 1. Логика добавления товара в корзину
 */
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        
        // Ищем, есть ли уже такой товар в корзине
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        
        updateCart();

        // Визуальный отклик на кнопке (Added!)
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
 * 2. Логика изменения количества (+ / -) внутри корзины
 * Привязана к глобальному окну для работы с динамическим HTML
 */
window.changeQuantity = function(name, delta) {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += delta;
        // Если количество стало 0 или меньше, удаляем товар
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.name !== name);
        }
        updateCart();
    }
};

/**
 * 3. Математика: расчет итогов (Subtotal + Delivery = Total)
 */
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = parseFloat(locationSelect.value) || 0;
    const total = subtotal + deliveryFee;

    // Обновляем текст в блоке итогов
    if (subtotalElement) subtotalElement.innerText = `£${subtotal.toFixed(2)}`;
    if (deliveryFeeElement) deliveryFeeElement.innerText = `£${deliveryFee.toFixed(2)}`;
    if (cartTotalPriceElement) cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
    
    // Обновляем плашку доставки вверху корзины
    if (deliveryFee > 0) {
        deliveryHeaderCost.innerText = `£${deliveryFee.toFixed(2)}`;
    } else {
        deliveryHeaderCost.innerText = "Select area";
    }
}

// Пересчитываем итог сразу при выборе города в выпадающем списке
if (locationSelect) {
    locationSelect.addEventListener('change', calculateTotal);
}

/**
 * 4. Обновление интерфейса корзины (рендеринг списка)
 */
function updateCart() {
    // Общее количество предметов для плавающей кнопки
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.innerText = totalItems;
    
    // Если корзина пуста — скрываем её
    if (totalItems === 0) {
        cartButton.classList.add('empty');
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Возвращаем скролл
        return;
    }

    cartButton.classList.remove('empty');

    // Генерируем HTML для списка товаров
    cartItemsContainer.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="color: #e84118; font-weight: 800; font-size: 0.9rem;">
                    £${(item.price * item.quantity).toFixed(2)}
                </div>
            </div>
            <div class="item-controls">
                <button class="qty-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
        </div>
    `).join('');

    calculateTotal();
}

/**
 * 5. Управление модальным окном (Открыть/Закрыть)
 */
cartButton.addEventListener('click', () => {
    if (cart.length > 0) {
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
    }
});

closeCart.addEventListener('click', () => {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Закрытие при клике вне области контента
window.onclick = (event) => { 
    if (event.target == cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

/**
 * 6. Финальная отправка формы (Checkout)
 */
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Проверка выбора зоны доставки
    if (!locationSelect.value || locationSelect.value === "") {
        alert('Please select a delivery area before confirming!');
        locationSelect.focus();
        return;
    }
    
    // Собираем соусы (опционально для отправки на сервер/email)
    const selectedSauces = Array.from(document.querySelectorAll('.sauce-chip input:checked'))
        .map(input => input.parentElement.innerText.trim());

    // Имитация успешного заказа
    alert('Thank you for your order! We will contact you shortly.');
    
    // Полная очистка
    cart = [];
    updateCart(); // Это само сбросит модалку и скролл
    checkoutForm.reset();
    if (locationSelect) locationSelect.value = "";
});
