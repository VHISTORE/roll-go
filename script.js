let cart = [];
let personCount = 1;
const MIN_ORDER_AMOUNT = 15.00; 

// --- ТВОИ ДАННЫЕ TELEGRAM ---
const TG_TOKEN = "8435173530:AAHQIA-MQRwAvuS9RFzMb1UZPFTpJF6fvMM"; 
const TG_CHAT_IDS = ["5776210499", "5512197362", "1979575911"]; 

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
const paymentSelect = document.getElementById('payment-method-select');
const checkoutForm = document.querySelector('.checkout-form');
const personCountDisplay = document.getElementById('person-count');
const paypalButtonContainer = document.getElementById('paypal-button-container');
const mainConfirmBtn = document.getElementById('main-confirm-btn');

// --- ДОБАВЛЕНИЕ ВЫБОРА ВРЕМЕНИ В HTML ---
const timeSection = document.createElement('div');
timeSection.className = 'select-wrapper';
timeSection.style.marginBottom = '15px';
timeSection.innerHTML = `
    <select id="delivery-time-select" required>
        <option value="" disabled selected>Select delivery time</option>
        <option value="ASAP">As soon as possible (from 15:30)</option>
    </select>
`;
// Вставляем перед выбором способа оплаты
paymentSelect.parentNode.parentNode.insertBefore(timeSection, paymentSelect.parentNode);
const timeSelect = document.getElementById('delivery-time-select');

// Функция генерации слотов времени (15:30 - 22:00)
function generateTimeSlots() {
    let startHour = 15;
    let startMin = 30;
    let endHour = 22;

    for (let h = startHour; h <= endHour; h++) {
        for (let m = (h === 15 ? 30 : 0); m < 60; m += 30) {
            if (h === 22 && m > 0) break;
            let timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            let opt = document.createElement('option');
            opt.value = timeString;
            opt.innerText = timeString;
            timeSelect.appendChild(opt);
        }
    }
}
generateTimeSlots();

// Настройки по умолчанию
paypalButtonContainer.style.display = 'none';
mainConfirmBtn.style.display = 'block';

/**
 * 1. ОТПРАВКА В TELEGRAM
 */
async function sendOrderToTelegram(paymentMethod, status = "NEW ORDER 🍣") {
    const name = checkoutForm.querySelector('input[placeholder="Name"]').value;
    const phone = checkoutForm.querySelector('input[placeholder="Phone Number"]').value;
    const area = locationSelect.options[locationSelect.selectedIndex].text;
    const address = checkoutForm.querySelector('input[placeholder="House / Flat No."]').value;
    const postCode = checkoutForm.querySelector('input[placeholder="Post Code"]').value;
    const deliveryTime = timeSelect.value;
    const sauces = Array.from(document.querySelectorAll('.sauce-chip input:checked'))
        .map(i => i.parentElement.innerText.trim()).join(', ');

    let message = `*${status}*\n\n`;
    message += `👤 *Customer:* ${name}\n`;
    message += `📞 *Phone:* ${phone}\n`;
    message += `📍 *Address:* ${area}, ${address}, ${postCode}\n`;
    message += `⏰ *Requested Time:* ${deliveryTime}\n\n`;
    message += `🍱 *Items:*\n` + cart.map(i => `- ${i.name} x${i.quantity} (£${(i.price * i.quantity).toFixed(2)})`).join('\n') + `\n\n`;
    message += `🥢 *Utensils:* ${personCount} person(s)\n`;
    message += `🍶 *Sauces:* ${sauces || 'None'}\n\n`;
    message += `💳 *Method:* ${paymentMethod}\n`;
    message += `💰 *TOTAL:* ${cartTotalPriceElement.innerText}`;

    for (const chatId of TG_CHAT_IDS) {
        try {
            await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
            });
        } catch (e) { console.error(`Error sending to ${chatId}:`, e); }
    }
}

/**
 * 2. PAYPAL / APPLE PAY
 */
async function initPayPalButtons() {
    if (paypalButtonContainer.innerHTML !== "") return;

    const renderDefaultButtons = () => {
        paypal.Buttons({
            style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' },
            createOrder: (data, actions) => {
                const total = cartTotalPriceElement.innerText.replace('£', '');
                return actions.order.create({ purchase_units: [{ amount: { value: total } }] });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(async () => {
                    await sendOrderToTelegram("PAID ONLINE ✅", "PAID ORDER 💳");
                    alert('Success! Order received.');
                    resetFullState();
                });
            }
        }).render('#paypal-button-container');
    };

    try {
        if (window.paypal && paypal.Applepay) {
            const config = await paypal.Applepay().config();
            if (config.isEligible) {
                paypal.Buttons({
                    fundingSource: paypal.FUNDING.APPLEPAY,
                    style: { color: 'black', shape: 'rect', label: 'pay' },
                    createOrder: (data, actions) => {
                        const total = cartTotalPriceElement.innerText.replace('£', '');
                        return actions.order.create({ purchase_units: [{ amount: { value: total } }] });
                    },
                    onApprove: (data, actions) => {
                        return actions.order.capture().then(async () => {
                            await sendOrderToTelegram("APPLE PAY ✅", "PAID ORDER 💳");
                            alert('Success! Order received.');
                            resetFullState();
                        });
                    }
                }).render('#paypal-button-container').catch(() => renderDefaultButtons());
            } else { renderDefaultButtons(); }
        } else { renderDefaultButtons(); }
    } catch (err) { renderDefaultButtons(); }
}

paymentSelect.addEventListener('change', (e) => {
    if (e.target.value === 'online') {
        paypalButtonContainer.style.display = 'block';
        mainConfirmBtn.style.display = 'none';
        initPayPalButtons();
    } else {
        paypalButtonContainer.style.display = 'none';
        mainConfirmBtn.style.display = 'block';
    }
});

/**
 * 3. ЛОГИКА ТОВАРОВ И КОРЗИНЫ
 */
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) { existingItem.quantity += 1; } 
        else { cart.push({ name, price, quantity: 1 }); }
        updateCart();
        
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            button.innerText = 'Add';
            button.style.backgroundColor = '';
        }, 400);
    });
});

document.getElementById('person-plus').addEventListener('click', () => { personCount++; personCountDisplay.innerText = personCount; });
document.getElementById('person-minus').addEventListener('click', () => { if (personCount > 1) { personCount--; personCountDisplay.innerText = personCount; } });

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
    
    subtotalElement.innerText = `£${subtotal.toFixed(2)}`;
    deliveryFeeElement.innerText = `£${deliveryFee.toFixed(2)}`;
    cartTotalPriceElement.innerText = `£${total.toFixed(2)}`;
    
    if (deliveryHeaderCost) {
        deliveryHeaderCost.innerText = deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Select area";
    }

    // Проверка времени и суммы
    let minOrderWarning = document.getElementById('min-order-warning');
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const isClosed = (currentH < 15 || (currentH === 15 && currentM < 30)) || (currentH >= 22);

    if (subtotal < MIN_ORDER_AMOUNT || isClosed) {
        if (!minOrderWarning) {
            minOrderWarning = document.createElement('div');
            minOrderWarning.id = 'min-order-warning';
            minOrderWarning.style.cssText = "color:#e84118; font-weight:bold; text-align:center; padding:10px; background:#ffe9e9; border-radius:12px; margin-bottom:15px; font-size:14px;";
            checkoutForm.prepend(minOrderWarning);
        }
        let msg = "";
        if (isClosed) msg += "🌙 Currently closed (Open 15:30 - 22:00). You can place a PRE-ORDER now!<br>";
        if (subtotal < MIN_ORDER_AMOUNT) msg += `Min. order is £${MIN_ORDER_AMOUNT.toFixed(2)}. Add £${(MIN_ORDER_AMOUNT - subtotal).toFixed(2)} more.`;
        minOrderWarning.innerHTML = msg;

        if (subtotal < MIN_ORDER_AMOUNT) {
            mainConfirmBtn.disabled = true; mainConfirmBtn.style.opacity = '0.5';
            paypalButtonContainer.style.pointerEvents = 'none'; paypalButtonContainer.style.opacity = '0.5';
        }
    } else {
        if (minOrderWarning) minOrderWarning.remove();
        mainConfirmBtn.disabled = false; mainConfirmBtn.style.opacity = '1';
        paypalButtonContainer.style.pointerEvents = 'all'; paypalButtonContainer.style.opacity = '1';
    }
}

if (locationSelect) locationSelect.addEventListener('change', calculateTotal);

function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.innerText = totalItems;
    if (totalItems === 0) { cartButton.classList.add('empty'); cartModal.style.display = 'none'; document.body.style.overflow = 'auto'; return; }
    cartButton.classList.remove('empty');
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="color: #e84118; font-weight: 800;">£${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="item-controls">
                <button type="button" class="qty-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                <span>${item.quantity}</span>
                <button type="button" class="qty-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

/**
 * 4. УПРАВЛЕНИЕ ОКНАМИ
 */
cartButton.addEventListener('click', () => { if (cart.length > 0) { cartModal.style.display = 'block'; document.body.style.overflow = 'hidden'; } });
closeCart.addEventListener('click', () => { cartModal.style.display = 'none'; document.body.style.overflow = 'auto'; });

function resetFullState() {
    cart = []; personCount = 1; personCountDisplay.innerText = "1";
    updateCart(); checkoutForm.reset(); locationSelect.value = ""; paymentSelect.value = "cash"; timeSelect.value = "";
    paypalButtonContainer.style.display = 'none'; mainConfirmBtn.style.display = 'block';
    document.body.style.overflow = 'auto'; cartModal.style.display = 'none';
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!locationSelect.value) return alert('Please select delivery area!');
    if (!timeSelect.value) return alert('Please select delivery time!');
    if (paymentSelect.value === 'online') return;
    const methodLabel = paymentSelect.value === 'terminal' ? "Card Terminal 💳" : "Cash on Delivery 💵";
    await sendOrderToTelegram(methodLabel);
    alert('Thank you! Your order has been sent.');
    resetFullState();
});
