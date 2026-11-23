
// ==========================================
// LogSphere Storefront
// ==========================================

const currentUser = document.getElementById("currentUser");
const currentRole = document.getElementById("currentRole");
const logoutButton = document.getElementById("logoutButton");
const aiLink = document.getElementById("aiLink");
const pageMessage = document.getElementById("pageMessage");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const productGrid = document.getElementById("productGrid");
const emptyProducts = document.getElementById("emptyProducts");

const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");

const categoryLinks = document.querySelectorAll(
    ".category-link[data-category]"
);

const productCards = Array.from(
    document.querySelectorAll(".product-card")
);

let username = "";
let role = "";
let selectedCategory = "All";
let cart = [];

// ==========================================
// Messages
// ==========================================

function showMessage(element, message) {
    if (element) {
        element.textContent = message;
    }
}

// ==========================================
// Authentication
// ==========================================

function initializeDashboard() {
    username = sessionStorage.getItem("loggedInUser") || "";
    role = sessionStorage.getItem("loggedInRole") || "";

    if (!username || !["ADMIN", "USER"].includes(role)) {
        window.location.replace("login.html");
        return false;
    }

    currentUser.textContent = username;
    currentRole.textContent = role;

    if (aiLink) {
        aiLink.hidden = role !== "ADMIN";
    }

    showMessage(
        pageMessage,
        role === "ADMIN"
            ? "Signed in as administrator."
            : "Welcome to the store."
    );

    return true;
}

// ==========================================
// Logout
// ==========================================

logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("loggedInRole");

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInRole");

    window.location.replace("login.html");
});

// ==========================================
// Cart storage
// ==========================================

function loadCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem("logSphereCart") || "[]"
        );

        cart = Array.isArray(savedCart)
            ? savedCart.filter(item =>
                item &&
                ["Laptop", "Mobile", "Headphones", "Keyboard"]
                    .includes(item.product) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
            : [];
    } catch (error) {
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem(
        "logSphereCart",
        JSON.stringify(cart)
    );
}

function updateCartCount() {
    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

function addToCart(product) {
    const existingItem = cart.find(
        item => item.product === product
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product: product,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();

    const button = document.querySelector(
        `[data-add="${product}"]`
    );

    if (button) {
        const originalText = button.textContent;

        button.textContent = "Added to cart ✓";
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1000);
    }
}

// ==========================================
// Add-to-cart buttons
// ==========================================

document.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", function () {
        addToCart(button.dataset.add);
    });
});

// ==========================================
// Open cart page
// ==========================================

if (cartButton) {
    cartButton.addEventListener("click", function () {
        window.location.href = "cart.html";
    });
}

// ==========================================
// Search and filtering
// ==========================================

function filterProducts() {
    const query = searchInput.value.trim().toLowerCase();

    productCards.forEach(card => {
        const name = card.dataset.product.toLowerCase();
        const category = card.dataset.category;

        const descriptionElement =
            card.querySelector(".product-description");

        const description = descriptionElement
            ? descriptionElement.textContent.toLowerCase()
            : "";

        const matchesSearch =
            name.includes(query) ||
            description.includes(query);

        const matchesCategory =
            selectedCategory === "All" ||
            category === selectedCategory;

        card.hidden = !(
            matchesSearch && matchesCategory
        );
    });

    const visibleProducts = productCards.some(
        card => !card.hidden
    );

    if (emptyProducts) {
        emptyProducts.hidden = visibleProducts;
    }
}

if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        filterProducts();

        const productsHeading =
            document.getElementById("products");

        if (productsHeading) {
            productsHeading.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}

// ==========================================
// Category navigation
// ==========================================

categoryLinks.forEach(link => {
    link.addEventListener("click", function () {
        selectedCategory = link.dataset.category;

        categoryLinks.forEach(categoryLink => {
            categoryLink.classList.toggle(
                "active",
                categoryLink === link
            );
        });

        filterProducts();
    });
});

// ==========================================
// Product sorting
// ==========================================

function sortProducts() {
    const mode = sortSelect.value;

    const sortedCards = [...productCards];

    sortedCards.sort((a, b) => {
        if (mode === "price-low") {
            return Number(a.dataset.price) -
                Number(b.dataset.price);
        }

        if (mode === "price-high") {
            return Number(b.dataset.price) -
                Number(a.dataset.price);
        }

        if (mode === "name") {
            return a.dataset.product.localeCompare(
                b.dataset.product
            );
        }

        return productCards.indexOf(a) -
            productCards.indexOf(b);
    });

    sortedCards.forEach(card => {
        productGrid.appendChild(card);
    });

    filterProducts();
}

if (sortSelect && productGrid) {
    sortSelect.addEventListener("change", sortProducts);
}

// ==========================================
// Initialize storefront
// ==========================================

if (initializeDashboard()) {
    loadCart();
    updateCartCount();
    filterProducts();
}
