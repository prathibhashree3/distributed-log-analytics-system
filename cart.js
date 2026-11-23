
const username = sessionStorage.getItem("loggedInUser") || "";
const role = sessionStorage.getItem("loggedInRole") || "";

const currentUser = document.getElementById("currentUser");
const currentRole = document.getElementById("currentRole");
const logoutButton = document.getElementById("logoutButton");

const cartItems = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const taxAmount = document.getElementById("taxAmount");
const cartTotal = document.getElementById("cartTotal");

const clearCartButton = document.getElementById("clearCartButton");
const checkoutButton = document.getElementById("checkoutButton");
const addressForm = document.getElementById("addressForm");

const addressMessage = document.getElementById("addressMessage");
const checkoutMessage = document.getElementById("checkoutMessage");

const cartSuccess = document.getElementById("cartSuccess");
const cartSuccessMessage = document.getElementById("cartSuccessMessage");

const shippingCost = document.getElementById("shippingCost");

const PRODUCTS = {
    Laptop: {
        price: 49999,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80"
    },
    Mobile: {
        price: 24999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80"
    },
    Headphones: {
        price: 2999,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80"
    },
    Keyboard: {
        price: 1499,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80"
    }
};

let cart = [];

function showMessage(element, message) {
    if (element) element.textContent = message;
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}

function loadCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("logSphereCart") || "[]"
        );

        cart = Array.isArray(saved)
            ? saved.filter(item =>
                PRODUCTS[item.product] &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
            : [];
    } catch {
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem("logSphereCart", JSON.stringify(cart));
}

function updateTotals() {
    const itemCount = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const subtotal = cart.reduce(
        (sum, item) =>
            sum + PRODUCTS[item.product].price * item.quantity,
        0
    );

    const tax = 0;
    const total = subtotal + tax;

    cartItemCount.textContent =
        `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

    cartSubtotal.textContent = money(subtotal);
    taxAmount.textContent = money(tax);
    cartTotal.textContent = money(total);
    shippingCost.textContent = "Free";
}

function renderCart() {
    cartItems.replaceChildren();

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cart-empty";

        const title = document.createElement("h3");
        title.textContent = "Your cart is empty";

        const description = document.createElement("p");
        description.textContent =
            "Explore our store and add something you like.";

        const link = document.createElement("a");
        link.href = "log-analytics.html";
        link.className = "checkout-button";
        link.textContent = "Browse products";

        empty.append(title, description, link);
        cartItems.appendChild(empty);
    } else {
        cart.forEach(item => {
            const product = PRODUCTS[item.product];

            const row = document.createElement("article");
            row.className = "cart-item";

            const image = document.createElement("img");
            image.className = "cart-product-image";
            image.src = product.image;
            image.alt = item.product;
            image.loading = "lazy";

            const details = document.createElement("div");
            details.className = "cart-product-details";

            const name = document.createElement("h3");
            name.textContent = item.product;

            const unitPrice = document.createElement("p");
            unitPrice.textContent = `${money(product.price)} each`;

            const quantity = document.createElement("div");
            quantity.className = "cart-quantity";

            const decrease = document.createElement("button");
            decrease.type = "button";
            decrease.textContent = "−";
            decrease.setAttribute(
                "aria-label",
                `Decrease ${item.product} quantity`
            );

            decrease.addEventListener("click", () => {
                item.quantity--;

                if (item.quantity <= 0) {
                    cart = cart.filter(
                        entry => entry.product !== item.product
                    );
                }

                saveCart();
                renderCart();
            });

            const count = document.createElement("span");
            count.textContent = item.quantity;

            const increase = document.createElement("button");
            increase.type = "button";
            increase.textContent = "+";
            increase.setAttribute(
                "aria-label",
                `Increase ${item.product} quantity`
            );

            increase.addEventListener("click", () => {
                item.quantity++;
                saveCart();
                renderCart();
            });

            quantity.append(decrease, count, increase);
            details.append(name, unitPrice, quantity);

            const right = document.createElement("div");
            right.className = "cart-product-right";

            const lineTotal = document.createElement("strong");
            lineTotal.textContent =
                money(product.price * item.quantity);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-cart-item";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                cart = cart.filter(
                    entry => entry.product !== item.product
                );

                saveCart();
                renderCart();
            });

            right.append(lineTotal, remove);
            row.append(image, details, right);
            cartItems.appendChild(row);
        });
    }

    updateTotals();
    clearCartButton.disabled = cart.length === 0;
    checkoutButton.disabled = cart.length === 0;
}

function loadAddress() {
    try {
        const address = JSON.parse(
            localStorage.getItem("logSphereAddress") || "null"
        );

        if (!address) return;

        document.getElementById("fullName").value =
            address.fullName || "";

        document.getElementById("addressLine").value =
            address.addressLine || "";

        document.getElementById("city").value =
            address.city || "";

        document.getElementById("postalCode").value =
            address.postalCode || "";
    } catch {
        // Ignore invalid saved address data.
    }
}

/* ---------- Authentication ---------- */
if (!username || !["ADMIN", "USER"].includes(role)) {
    window.location.replace("login.html");
} else {
    currentUser.textContent = username;
    currentRole.textContent = role;
}

logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("loggedInRole");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInRole");

    window.location.replace("login.html");
});

/* ---------- Cart actions ---------- */
clearCartButton.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
    showMessage(checkoutMessage, "");
});

loadCart();
loadAddress();
renderCart();

/* ---------- Save address ---------- */
addressForm.addEventListener("submit", event => {
    event.preventDefault();

    const address = {
        fullName: document.getElementById("fullName").value.trim(),
        addressLine: document.getElementById("addressLine").value.trim(),
        city: document.getElementById("city").value.trim(),
        postalCode: document.getElementById("postalCode").value.trim()
    };

    if (
        !address.fullName ||
        !address.addressLine ||
        !address.city ||
        !/^\d{6}$/.test(address.postalCode)
    ) {
        showMessage(
            addressMessage,
            "Please complete the address and enter a valid 6-digit PIN code."
        );
        return;
    }

    localStorage.setItem(
        "logSphereAddress",
        JSON.stringify(address)
    );

    showMessage(addressMessage, "Address saved successfully.");
});

/* ---------- Checkout ---------- */
checkoutButton.addEventListener("click", async () => {
    if (!username || !["ADMIN", "USER"].includes(role)) {
        window.location.replace("login.html");
        return;
    }

    if (cart.length === 0) {
        showMessage(checkoutMessage, "Your cart is empty.");
        return;
    }

    if (!addressForm.reportValidity()) {
        showMessage(
            checkoutMessage,
            "Please enter your delivery address first."
        );
        return;
    }

    if (!addressForm.requestSubmit) {
        addressForm.dispatchEvent(
            new Event("submit", { cancelable: true })
        );
    } else {
        addressForm.requestSubmit();
    }

    const address = JSON.parse(
        localStorage.getItem("logSphereAddress") || "null"
    );

    if (!address) {
        showMessage(
            checkoutMessage,
            "Please save your delivery address first."
        );
        return;
    }

    checkoutButton.disabled = true;
    showMessage(checkoutMessage, "Checking order availability...");

    try {
        const token = btoa("admin:Admin@123");

        for (const item of cart) {
            const orderResponse = await fetch(
                `http://localhost:8083/orders?product=${encodeURIComponent(item.product)}&user=${encodeURIComponent(username)}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${token}`
                    }
                }
            );

            const orderResult = await orderResponse.text();

            if (!orderResponse.ok) {
                showMessage(
                    checkoutMessage,
                    `Order request failed (${orderResponse.status}).`
                );
                return;
            }

            if (!orderResult.includes("Order ready for payment")) {
                showMessage(checkoutMessage, orderResult);
                return;
            }
        }

        showMessage(checkoutMessage, "Processing payment...");

        const selectedMethod = document.querySelector(
            'input[name="cartPaymentMethod"]:checked'
        );

        const paymentMethod = selectedMethod
            ? selectedMethod.value
            : "Card";

        const paymentResponse = await fetch(
            `http://localhost:8084/payments?user=${encodeURIComponent(username)}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${token}`
                }
            }
        );

        const paymentResult = await paymentResponse.text();

        if (!paymentResponse.ok) {
            showMessage(
                checkoutMessage,
                `Payment request failed (${paymentResponse.status}).`
            );
            return;
        }

        if (paymentResult.toLowerCase().includes("payment successful")) {
            const subtotal = cart.reduce(
                (sum, item) =>
                    sum + PRODUCTS[item.product].price * item.quantity,
                0
            );

            cartSuccessMessage.textContent =
                `Thank you, ${address.fullName}! Your order total is ` +
                `${money(subtotal)}. Payment method: ${paymentMethod}.`;

            cart = [];
            saveCart();
            renderCart();

            cartSuccess.hidden = false;
            document.querySelector(".cart-layout").hidden = true;
            document.querySelector(".cart-page-heading").hidden = true;
        } else {
            showMessage(checkoutMessage, paymentResult);
        }
    } catch (error) {
        console.error("Checkout error:", error);

        showMessage(
            checkoutMessage,
            "Unable to connect to the Order or Payment Service. Check that both services are running."
        );
    } finally {
        checkoutButton.disabled = false;
    }
});
