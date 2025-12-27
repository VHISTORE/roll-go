let cart = [];
let personCount = 1;

// --- ТВОИ ДАННЫЕ TELEGRAM ---
const TG_TOKEN = "8435173530:AAHQIA-MQRwAvuS9RFzMb1UZPFTpJF6fvMM"; 
const TG_CHAT_ID = "5776210499"; 

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
const paypalButtonContainer = document.getElementById('paypal-button-container');
const mainConfirmBtn = document.getElementById('main-confirm-btn');

/**
 * 1. ОТПРАВКА В TELEGRAM
 */
async function sendOrderToTelegram(paymentMethod, status = "NEW ORDER 🍣") {
    const name = checkoutForm.querySelector('input[placeholder="Name"]').value;
    const phone = checkoutForm.querySelector('input[placeholder="Phone Number"]').value;
    const area = locationSelect.options[locationSelect.selectedIndex].text;
    const address = checkoutForm.querySelector('input[placeholder="House / Flat No."]').value;
    const postCode = checkoutForm.querySelector('input[placeholder="Post Code"]').value;
    const sauces = Array.from(document.querySelectorAll('.sauce-chip input:checked'))
        .map(i => i.parentElement.innerText.trim()).join(', ');

    let message = `*${status}*\n\n`;
    message += `👤 *Customer:* ${name}\n`;
    message += `📞 *Phone:* ${phone}\n`;
    message += `📍 *Address:* ${area}, ${address}, ${postCode}\n\n`;
    message += `🍱 *Items:*\n` + cart.map(i => `- ${i.name} x${i.quantity} (£${(i.price * i.quantity).toFixed(2)})`).join('\n') + `\n\n`;
    message += `🥢 *Utensils:* ${personCount} person(s)\n`;
    message += `🍶 *Sauces:* ${sauces || 'None'}\n\n`;
    message += `💳 *Method:* ${paymentMethod}\n`;
    message += `💰 *TOTAL:* ${cartTotalPriceElement.innerText}`;

    try {
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Telegram Error:', error);
    }
}

/**
 * 2. PAYPAL / APPLE PAY
 */
async function initPayPalButtons() {
    if (paypalButtonContainer.innerHTML !== "") return;

    try {
        let isApplePayEligible = false;

        // Проверяем доступность Apple Pay программно, чтобы не вызвать ошибку инициализации
        if (window.paypal && paypal.Applepay) {
            try {
                const applePayConfig = await paypal.Applepay().config();
                if (applePayConfig.isEligible) {
                    isApplePayEligible = true;
                    console.log("Apple Pay eligible: YES");
                }
            } catch (e) {
                console.log("Apple Pay check skipped or not supported");
            }
        }

        const buttonConfig = {
            style: { 
                layout: 'vertical', 
                color: 'black', 
                shape: 'rect', 
                label: 'pay' 
            },
            createOrder: (data, actions) => {
                const total = cartTotalPriceElement.innerText.replace('£', '');
                return actions.order.create({
                    purchase_units: [{ amount: { value: total } }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(async details => {
                    await sendOrderToTelegram("Paid Online ✅", "PAID ORDER 💳");
                    alert('Success! Order paid and sent to the kitchen.');
                    resetFullState();
                });
            },
            onError: (err) => {
                console.error('Payment Error:', err);
            }
        };

        // Если Apple Pay доступен — форсируем его
        if (isApplePayEligible) {
            buttonConfig.fundingSource = paypal.FUNDING.APPLEPAY;
        }

        paypal.Buttons(buttonConfig).render('#paypal-button-container');

    } catch (err) {
        console.error('Failed to init PayPal:', err);
        // Запасной вариант: рендерим стандартные кнопки без форсирования
        paypal.Buttons({
            style: { layout: 'vertical', color: 'blue', shape: 'rect' }
        }).render('#paypal-button-container');
    }
}

// Переключение кнопок при выборе оплаты
document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener('change', (e) => {
        if (e.target.value === 'online') {
            paypalButtonContainer.style.display = 'block';
            mainConfirmBtn.style.display = 'none';
            initPayPalButtons();
        } else {
            paypalButtonContainer.style.display = 'none';
            mainConfirmBtn.style.display = 'block';
        }
    });
});

/**
 * 3. ЛОГИКА ТОВАРОВ
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
        animateCartButton(button);
    });
});

function animateCartButton(button) {
    const originalText = button.innerText;
    button.innerText = 'Added!';
    button.style.backgroundColor = '#27ae60';
    cartButton.style.transform = 'scale(1.2)';
    setTimeout(() => {
        button.innerText = originalText;
        button.style.backgroundColor = '';
        cartButton.style.transform = 'scale(1)';
    }, 400);
}

personPlus.addEventListener('click', () => { personCount++; personCountDisplay.innerText = personCount; });
personMinus.addEventListener('click', () => { if (personCount > 1) { personCount--; personCountDisplay.innerText = personCount; } });

window.changeQuantity = function(name, delta) {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.name !== name);
        updateCart();
    }
};

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = parseFloat(locationSelect.value) || 0;
    const total = subtotal + deliveryFee;

    if (subtotalElement) subtotalElement.innerText = `£${subtotal.toFixed(2)}`;
    if (deliveryFeeElement) deliveryFeeElement.innerText = `£${deliveryFee.toFixed(2)}`;
    if (cartTotalPriceElement) cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
    
    if (deliveryHeaderCost) {
        deliveryHeaderCost.innerText = deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Select area";
    }
}

if (locationSelect) locationSelect.addEventListener('change', calculateTotal);

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
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="color: #e84118; font-weight: 800; font-size: 0.9rem;">£${(item.price * item.quantity).toFixed(2)}</div>
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
 * 4. МОДАЛЬНОЕ ОКНО И СБРОС
 */
cartButton.addEventListener('click', () => { if (cart.length > 0) { cartModal.style.display = 'block'; document.body.style.overflow = 'hidden'; } });
closeCart.addEventListener('click', () => { cartModal.style.display = 'none'; document.body.style.overflow = 'auto'; });
window.onclick = (e) => { if (e.target == cartModal) { cartModal.style.display = 'none'; document.body.style.overflow = 'auto'; } };

function resetFullState() {
    cart = [];
    personCount = 1;
    if (personCountDisplay) personCountDisplay.innerText = "1";
    updateCart();
    checkoutForm.reset();
    if (locationSelect) locationSelect.value = "";
    document.body.style.overflow = 'auto';
    cartModal.style.display = 'none';
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!locationSelect.value) return alert('Please select delivery area!');
    
    await sendOrderToTelegram("Cash on Delivery 💵", "NEW ORDER 🍱");
    alert('Thank you! Order sent to our team.');
    resetFullState();
});
