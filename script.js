let cart = [];
let personCount = 1;
const MIN_ORDER_AMOUNT = 15.00; 

const TG_TOKEN = "8435173530:AAHQIA-MQRwAvuS9RFzMb1UZPFTpJF6fvMM"; 
const TG_CHAT_IDS = ["5776210499", "5512197362", "1979575911"]; 

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


paypalButtonContainer.style.display = 'none';
mainConfirmBtn.style.display = 'block';

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

    for (const chatId of TG_CHAT_IDS) {
        try {
            await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        } catch (e) { 
            console.error(`Error sending to ${chatId}:`, e); 
        }
    }
}

async function initPayPalButtons() {
    if (paypalButtonContainer.innerHTML !== "") return;

    const renderDefaultButtons = () => {
        paypal.Buttons({
            style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' },
            createOrder: (data, actions) => {
                const total = cartTotalPriceElement.innerText.replace('£', '');
                return actions.order.create({
                    purchase_units: [{ amount: { value: total } }]
                });
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
                        return actions.order.create({
                            purchase_units: [{ amount: { value: total } }]
                        });
                    },
                    onApprove: (data, actions) => {
                        return actions.order.capture().then(async () => {
                            await sendOrderToTelegram("APPLE PAY ✅", "PAID ORDER 💳");
                            alert('Success! Order received.');
                            resetFullState();
                        });
                    }
                }).render('#paypal-button-container').catch((e) => {
                    console.log("Apple Pay failed, falling back to PayPal");
                    renderDefaultButtons();
                });
            } else { renderDefaultButtons(); }
        } else { renderDefaultButtons(); }
    } catch (err) { 
        console.error("PayPal Init Error:", err);
        renderDefaultButtons(); 
    }
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

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) { existingItem.quantity += 1; } 
        else { cart.push({ name, price, quantity: 1 }); }
        updateCart();
        
        const originalText = button.innerText;
        button.innerText = 'Added!';
        button.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            button.innerText = 'Add';
            button.style.backgroundColor = '';
        }, 400);
    });
});

document.getElementById('person-plus').addEventListener('click', () => { 
    personCount++; 
    personCountDisplay.innerText = personCount; 
});
document.getElementById('person-minus').addEventListener('click', () => { 
    if (personCount > 1) { 
        personCount--; 
        personCountDisplay.innerText = personCount; 
    } 
});

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

    let minOrderWarning = document.getElementById('min-order-warning');
    if (subtotal < MIN_ORDER_AMOUNT) {
        if (!minOrderWarning) {
            minOrderWarning = document.createElement('div');
            minOrderWarning.id = 'min-order-warning';
            minOrderWarning.style.color = '#e84118';
            minOrderWarning.style.fontWeight = 'bold';
            minOrderWarning.style.textAlign = 'center';
            minOrderWarning.style.padding = '10px';
            minOrderWarning.style.background = '#ffe9e9';
            minOrderWarning.style.borderRadius = '12px';
            minOrderWarning.style.marginBottom = '15px';
            checkoutForm.prepend(minOrderWarning);
        }
        minOrderWarning.innerText = `Min. order amount is £${MIN_ORDER_AMOUNT.toFixed(2)}. Add £${(MIN_ORDER_AMOUNT - subtotal).toFixed(2)} more.`;
        
        mainConfirmBtn.disabled = true;
        mainConfirmBtn.style.opacity = '0.5';
        paypalButtonContainer.style.pointerEvents = 'none';
        paypalButtonContainer.style.opacity = '0.5';
    } else {
        if (minOrderWarning) minOrderWarning.remove();
        
        mainConfirmBtn.disabled = false;
        mainConfirmBtn.style.opacity = '1';
        paypalButtonContainer.style.pointerEvents = 'all';
        paypalButtonContainer.style.opacity = '1';
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

function resetFullState() {
    cart = []; 
    personCount = 1;
    personCountDisplay.innerText = "1";
    updateCart();
    checkoutForm.reset();
    locationSelect.value = "";
    paymentSelect.value = "cash";
    paypalButtonContainer.style.display = 'none';
    mainConfirmBtn.style.display = 'block';
    document.body.style.overflow = 'auto';
    cartModal.style.display = 'none';
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!locationSelect.value) return alert('Please select delivery area!');
    
    const method = paymentSelect.value;
    if (method === 'online') return;

    const methodLabel = method === 'terminal' ? "Card Terminal on Delivery 💳" : "Cash on Delivery 💵";
    await sendOrderToTelegram(methodLabel, "NEW ORDER 🍱");
    alert('Thank you! Your order has been sent to the team.');
    resetFullState();
});
