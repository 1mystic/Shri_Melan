/**
 * app.js
 * ShriMelan Restaurant Portal - Core State Engine, Routing, and UI Interactions
 */

// ==========================================================================
// 1. Central Application State
// ==========================================================================
const ShriMelan = {
    // Menu catalog items
    menuItems: [],
    // Active dining tables (12 tables layout)
    tables: [],
    // Completed order transaction history
    completedOrders: [],
    // Customer Cart (for user self-ordering)
    cart: [],
    // Table number currently selected by customer
    selectedTableForUser: null,
    // Active Waiter POS table number
    activePOSTable: null,
    // Low stock alert threshold
    lowStockThreshold: 10
};

// ==========================================================================
// 2. Beautiful Food & Sales Mock Data Seeds
// ==========================================================================
const DEFAULT_MENU_SEEDS = [
    {
        Item_ID: "Burger-001",
        Item_Name: "Smoky BBQ Cheddar Burger",
        Category: "Burgers",
        Cost_to_Make: 3.20,
        Price: 11.99,
        Stock_Qty: 35,
        Image_URL: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop",
        Description: "Charbroiled Angus beef, smoked cheddar cheese, honey BBQ glaze, crispy onion straws, toasted brioche.",
        Rating: 4.8
    },
    {
        Item_ID: "Burger-002",
        Item_Name: "Classic Truffle Cheeseburger",
        Category: "Burgers",
        Cost_to_Make: 4.10,
        Price: 13.49,
        Stock_Qty: 8, // Triggers low stock alert!
        Image_URL: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop",
        Description: "Premium double beef patty, white truffle aioli, melted swiss cheese, caramelized balsamic onions.",
        Rating: 4.9
    },
    {
        Item_ID: "Pizza-001",
        Item_Name: "Woodfired Margherita Pizza",
        Category: "Pizza",
        Cost_to_Make: 2.80,
        Price: 10.99,
        Stock_Qty: 45,
        Image_URL: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop",
        Description: "Traditional crust, fresh mozzarella di bufala, organic san marzano tomatoes, fresh garden basil.",
        Rating: 4.7
    },
    {
        Item_ID: "Pizza-002",
        Item_Name: "Elite Spicy Pepperoni Pizza",
        Category: "Pizza",
        Cost_to_Make: 3.50,
        Price: 13.99,
        Stock_Qty: 28,
        Image_URL: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop",
        Description: "Artisan crust, premium cup-and-char Italian pepperoni, jalapeño rings, organic hot honey drizzle.",
        Rating: 4.8
    },
    {
        Item_ID: "Salad-001",
        Item_Name: "Crisp Avocado Caesar Salad",
        Category: "Salads",
        Cost_to_Make: 2.10,
        Price: 9.49,
        Stock_Qty: 50,
        Image_URL: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop",
        Description: "Crisp romaine, diced avocado, shaved parmigiano-reggiano, garlic croutons, house creamy Caesar.",
        Rating: 4.5
    },
    {
        Item_ID: "Salad-002",
        Item_Name: "Superfood Quinoa Buddha Bowl",
        Category: "Salads",
        Cost_to_Make: 2.40,
        Price: 11.29,
        Stock_Qty: 22,
        Image_URL: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop",
        Description: "Tri-color quinoa, roasted organic sweet potatoes, massaged kale, crunchy spiced chickpeas, creamy tahini.",
        Rating: 4.6
    },
    {
        Item_ID: "Dessert-001",
        Item_Name: "Decadent Chocolate Lava Cake",
        Category: "Desserts",
        Cost_to_Make: 1.50,
        Price: 6.99,
        Stock_Qty: 4, // Triggers low stock alert!
        Image_URL: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop",
        Description: "Molten Belgian chocolate core, premium vanilla bean gelato scoop, fresh seasonal raspberry coulis.",
        Rating: 4.9
    },
    {
        Item_ID: "Dessert-002",
        Item_Name: "Classic Strawberry Cheesecake",
        Category: "Desserts",
        Cost_to_Make: 1.80,
        Price: 7.49,
        Stock_Qty: 18,
        Image_URL: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop",
        Description: "Creamy New York cheesecake on crunchy graham cracker base, glazed strawberry reduction topper.",
        Rating: 4.7
    },
    {
        Item_ID: "Drink-001",
        Item_Name: "Fresh Mint Lime Mojito",
        Category: "Drinks",
        Cost_to_Make: 0.60,
        Price: 4.99,
        Stock_Qty: 85,
        Image_URL: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop",
        Description: "Muddled fresh spearmint leaves, key lime juice, organic brown sugar, double-filtered sparkling soda.",
        Rating: 4.4
    },
    {
        Item_ID: "Drink-002",
        Item_Name: "Premium Cold Brew Coffee",
        Category: "Drinks",
        Cost_to_Make: 0.80,
        Price: 5.49,
        Stock_Qty: 60,
        Image_URL: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop",
        Description: "18-hour cold-steeped organic arabica beans, vanilla sweet cream splash, served over ice.",
        Rating: 4.6
    }
];

// Seed interesting historical orders to generate beautiful basket analytics and BCG scatter quadrants!
const DEFAULT_ORDER_SEEDS = [
    { Order_ID: "TX-1001", Table_No: 3, Timestamp: "2026-05-20T12:30:00Z", Date: "2026-05-20", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1002", Table_No: 5, Timestamp: "2026-05-20T13:15:00Z", Date: "2026-05-20", Month_No: 5, Month: "May", Items_Ordered: ["Woodfired Margherita Pizza", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 15.98, Tax: 1.60, Total_Revenue: 17.58 },
    { Order_ID: "TX-1003", Table_No: 1, Timestamp: "2026-05-20T19:40:00Z", Date: "2026-05-20", Month_No: 5, Month: "May", Items_Ordered: ["Classic Truffle Cheeseburger", "Decadent Chocolate Lava Cake"], Quantities: [1, 1], Subtotal: 20.48, Tax: 2.05, Total_Revenue: 22.53 },
    { Order_ID: "TX-1004", Table_No: 8, Timestamp: "2026-05-21T12:00:00Z", Date: "2026-05-21", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1005", Table_No: 2, Timestamp: "2026-05-21T13:30:00Z", Date: "2026-05-21", Month_No: 5, Month: "May", Items_Ordered: ["Crisp Avocado Caesar Salad", "Premium Cold Brew Coffee"], Quantities: [1, 1], Subtotal: 14.98, Tax: 1.50, Total_Revenue: 16.48 },
    { Order_ID: "TX-1006", Table_No: 7, Timestamp: "2026-05-21T18:30:00Z", Date: "2026-05-21", Month_No: 5, Month: "May", Items_Ordered: ["Woodfired Margherita Pizza", "Fresh Mint Lime Mojito"], Quantities: [2, 2], Subtotal: 31.96, Tax: 3.20, Total_Revenue: 35.16 },
    { Order_ID: "TX-1007", Table_No: 4, Timestamp: "2026-05-22T13:00:00Z", Date: "2026-05-22", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1008", Table_No: 9, Timestamp: "2026-05-22T20:15:00Z", Date: "2026-05-22", Month_No: 5, Month: "May", Items_Ordered: ["Elite Spicy Pepperoni Pizza", "Fresh Mint Lime Mojito"], Quantities: [1, 2], Subtotal: 23.97, Tax: 2.40, Total_Revenue: 26.37 },
    { Order_ID: "TX-1009", Table_No: 11, Timestamp: "2026-05-23T12:20:00Z", Date: "2026-05-23", Month_No: 5, Month: "May", Items_Ordered: ["Classic Truffle Cheeseburger", "Decadent Chocolate Lava Cake"], Quantities: [1, 1], Subtotal: 20.48, Tax: 2.05, Total_Revenue: 22.53 },
    { Order_ID: "TX-1010", Table_No: 6, Timestamp: "2026-05-23T13:45:00Z", Date: "2026-05-23", Month_No: 5, Month: "May", Items_Ordered: ["Superfood Quinoa Buddha Bowl", "Premium Cold Brew Coffee"], Quantities: [1, 1], Subtotal: 16.78, Tax: 1.68, Total_Revenue: 18.46 },
    { Order_ID: "TX-1011", Table_No: 3, Timestamp: "2026-05-24T14:00:00Z", Date: "2026-05-24", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [2, 2], Subtotal: 33.96, Tax: 3.40, Total_Revenue: 37.36 },
    { Order_ID: "TX-1012", Table_No: 5, Timestamp: "2026-05-24T19:00:00Z", Date: "2026-05-24", Month_No: 5, Month: "May", Items_Ordered: ["Woodfired Margherita Pizza", "Fresh Mint Lime Mojito", "Decadent Chocolate Lava Cake"], Quantities: [1, 1, 1], Subtotal: 22.97, Tax: 2.30, Total_Revenue: 25.27 },
    { Order_ID: "TX-1013", Table_No: 12, Timestamp: "2026-05-25T13:00:00Z", Date: "2026-05-25", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1014", Table_No: 2, Timestamp: "2026-05-25T20:30:00Z", Date: "2026-05-25", Month_No: 5, Month: "May", Items_Ordered: ["Classic Truffle Cheeseburger", "Decadent Chocolate Lava Cake", "Premium Cold Brew Coffee"], Quantities: [1, 1, 1], Subtotal: 25.97, Tax: 2.60, Total_Revenue: 28.57 },
    { Order_ID: "TX-1015", Table_No: 1, Timestamp: "2026-05-26T12:10:00Z", Date: "2026-05-26", Month_No: 5, Month: "May", Items_Ordered: ["Crisp Avocado Caesar Salad", "Premium Cold Brew Coffee"], Quantities: [1, 1], Subtotal: 14.98, Tax: 1.50, Total_Revenue: 16.48 },
    { Order_ID: "TX-1016", Table_No: 7, Timestamp: "2026-05-26T19:15:00Z", Date: "2026-05-26", Month_No: 5, Month: "May", Items_Ordered: ["Woodfired Margherita Pizza", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 15.98, Tax: 1.60, Total_Revenue: 17.58 },
    { Order_ID: "TX-1017", Table_No: 8, Timestamp: "2026-05-27T13:00:00Z", Date: "2026-05-27", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1018", Table_No: 10, Timestamp: "2026-05-27T21:00:00Z", Date: "2026-05-27", Month_No: 5, Month: "May", Items_Ordered: ["Elite Spicy Pepperoni Pizza", "Classic Strawberry Cheesecake"], Quantities: [1, 1], Subtotal: 21.48, Tax: 2.15, Total_Revenue: 23.63 },
    { Order_ID: "TX-1019", Table_No: 4, Timestamp: "2026-05-28T12:40:00Z", Date: "2026-05-28", Month_No: 5, Month: "May", Items_Ordered: ["Smoky BBQ Cheddar Burger", "Fresh Mint Lime Mojito"], Quantities: [1, 1], Subtotal: 16.98, Tax: 1.70, Total_Revenue: 18.68 },
    { Order_ID: "TX-1020", Table_No: 5, Timestamp: "2026-05-28T18:50:00Z", Date: "2026-05-28", Month_No: 5, Month: "May", Items_Ordered: ["Classic Truffle Cheeseburger", "Decadent Chocolate Lava Cake"], Quantities: [1, 1], Subtotal: 20.48, Tax: 2.05, Total_Revenue: 22.53 }
];

// ==========================================================================
// 3. Application Initialization & LocalStorage Loader
// ==========================================================================
function initApp() {
    // A. Theme Engine Setup
    const themeBtn = document.getElementById("theme-btn");
    const currentTheme = localStorage.getItem("shriMelan_theme") || "dark";
    if (currentTheme === "light") {
        document.body.classList.add("light-theme");
        themeBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        themeBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        localStorage.setItem("shriMelan_theme", isLight ? "light" : "dark");
        themeBtn.innerHTML = isLight ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        lucide.createIcons();
    });

    // B. Load / Seed Data
    if (localStorage.getItem("shriMelan_menuItems")) {
        ShriMelan.menuItems = JSON.parse(localStorage.getItem("shriMelan_menuItems"));
    } else {
        ShriMelan.menuItems = [...DEFAULT_MENU_SEEDS];
        saveState("menuItems");
    }

    if (localStorage.getItem("shriMelan_completedOrders")) {
        ShriMelan.completedOrders = JSON.parse(localStorage.getItem("shriMelan_completedOrders"));
    } else {
        ShriMelan.completedOrders = [...DEFAULT_ORDER_SEEDS];
        saveState("completedOrders");
    }

    if (localStorage.getItem("shriMelan_tables")) {
        ShriMelan.tables = JSON.parse(localStorage.getItem("shriMelan_tables"));
    } else {
        // Initialize 12 tables
        for (let i = 1; i <= 12; i++) {
            ShriMelan.tables.push({
                Table_No: i,
                Status: "Available", // "Available", "Busy", "Billing", "Draft"
                ActiveTicket: null   // { Items: { "ItemID": qty }, Notes: "", StartTime: timestamp }
            });
        }
        saveState("tables");
    }

    // C. Wire View Routers
    const portalBtn = document.getElementById("portal-btn");
    const portalBtnText = document.getElementById("portal-btn-text");
    const userView = document.getElementById("user-view");
    const adminView = document.getElementById("admin-view");

    portalBtn.addEventListener("click", () => {
        if (userView.classList.contains("active")) {
            userView.classList.remove("active");
            adminView.classList.add("active");
            portalBtnText.textContent = "Customer View";
            portalBtn.innerHTML = '<i data-lucide="arrow-left"></i> <span>Customer View</span>';
            // Refresh admin views
            refreshAdminPortal();
        } else {
            adminView.classList.remove("active");
            userView.classList.add("active");
            portalBtnText.textContent = "Admin Portal";
            portalBtn.innerHTML = '<i data-lucide="shield-check"></i> <span>Admin Portal</span>';
            renderUserMenu();
        }
        lucide.createIcons();
    });

    // Sidebar subpage links routing
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const subpages = document.querySelectorAll(".admin-subpage");

    sidebarLinks.forEach(link => {
        link.addEventListener("click", () => {
            sidebarLinks.forEach(l => l.classList.remove("active"));
            subpages.forEach(s => s.classList.remove("active"));

            link.classList.add("active");
            const targetSubpage = document.getElementById(link.getAttribute("data-target"));
            targetSubpage.classList.add("active");
            
            // Subpage specific renders
            if (link.getAttribute("data-target") === "pos-subpage") {
                renderPOSTables();
            } else if (link.getAttribute("data-target") === "menu-subpage") {
                renderInventoryCRUD();
            } else if (link.getAttribute("data-target") === "analytics-subpage") {
                if (window.ShriMelanAnalytics) {
                    window.ShriMelanAnalytics.updateAnalytics();
                }
            } else if (link.getAttribute("data-target") === "overview-subpage") {
                renderOverviewDashboard();
            }
            lucide.createIcons();
        });
    });

    // D. Wire Dialog Event Listeners
    setupModalsAndDrawers();

    // E. Initial Renders
    renderUserMenu();
    renderOverviewDashboard();
    
    // Initialise vector icons
    lucide.createIcons();
    
    // Connect Drive Module OAuth fields
    if (window.ShriMelanDrive) {
        window.ShriMelanDrive.initOAuthUI();
    }
}

function saveState(key) {
    localStorage.setItem(`shriMelan_${key}`, JSON.stringify(ShriMelan[key]));
}

// ==========================================================================
// 4. User Landing Page Logic (Browse & Self-Order)
// ==========================================================================
let activeCategoryFilter = "All";

function renderUserMenu() {
    const searchVal = document.getElementById("menu-search-input").value.toLowerCase();
    
    // A. Render Categories Tabs
    const categories = ["All", ...new Set(ShriMelan.menuItems.map(item => item.Category))];
    const categoryContainer = document.getElementById("category-tabs-container");
    categoryContainer.innerHTML = "";
    
    categories.forEach(cat => {
        const tab = document.createElement("button");
        tab.className = `category-tab ${activeCategoryFilter === cat ? 'active' : ''}`;
        
        let iconHtml = '<i data-lucide="tag"></i>';
        if (cat === "All") iconHtml = '<i data-lucide="grid"></i>';
        else if (cat === "Burgers") iconHtml = '<i data-lucide="pocket"></i>';
        else if (cat === "Pizza") iconHtml = '<i data-lucide="circle-dot"></i>';
        else if (cat === "Salads") iconHtml = '<i data-lucide="leaf"></i>';
        else if (cat === "Desserts") iconHtml = '<i data-lucide="cake"></i>';
        else if (cat === "Drinks") iconHtml = '<i data-lucide="glass-water"></i>';

        tab.innerHTML = `${iconHtml} <span>${cat}</span>`;
        tab.addEventListener("click", () => {
            activeCategoryFilter = cat;
            renderUserMenu();
        });
        categoryContainer.appendChild(tab);
    });

    // B. Render Food Grid
    const menuGrid = document.getElementById("menu-items-grid");
    menuGrid.innerHTML = "";

    const filteredItems = ShriMelan.menuItems.filter(item => {
        const matchesCategory = (activeCategoryFilter === "All" || item.Category === activeCategoryFilter);
        const matchesSearch = item.Item_Name.toLowerCase().includes(searchVal) || item.Description.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-secondary);">
            <i data-lucide="info" style="width:48px; height:48px; margin: 0 auto 10px;"></i>
            <p>No delicious dishes found matching your criteria.</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-card";
        
        const isOutOfStock = item.Stock_Qty <= 0;
        
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${item.Image_URL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" alt="${item.Item_Name}">
                <span class="category-badge">${item.Category}</span>
                ${isOutOfStock ? '<div class="stock-out-badge">SOLD OUT</div>' : ''}
            </div>
            <div class="card-info">
                <div class="rating-row">
                    <i data-lucide="star" style="fill:currentColor; width:14px; height:14px;"></i>
                    <span>${item.Rating.toFixed(1)}</span>
                </div>
                <h3>${item.Item_Name}</h3>
                <p>${item.Description}</p>
            </div>
            <div class="card-footer">
                <span class="card-price">$${item.Price.toFixed(2)}</span>
                <button class="btn-card-add" ${isOutOfStock ? 'disabled' : ''} onclick="addLandingItemToCart('${item.Item_ID}')">
                    <i data-lucide="plus"></i>
                </button>
            </div>
        `;
        menuGrid.appendChild(card);
    });
    lucide.createIcons();
}

// User View Search Listener
document.getElementById("menu-search-input").addEventListener("input", renderUserMenu);

// Cart Handling for Self-Order
function addLandingItemToCart(itemId) {
    const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
    if (!item || item.Stock_Qty <= 0) return;

    const cartItem = ShriMelan.cart.find(c => c.item.Item_ID === itemId);
    if (cartItem) {
        if (cartItem.qty + 1 > item.Stock_Qty) {
            alert("Sorry, we cannot supply more than the current stock limits.");
            return;
        }
        cartItem.qty++;
    } else {
        ShriMelan.cart.push({ item, qty: 1 });
    }
    
    updateCustomerCartUI();
    // Quick micro-animation feedback
    const cartBtn = document.getElementById("cart-btn");
    cartBtn.style.transform = "scale(1.25)";
    setTimeout(() => cartBtn.style.transform = "", 150);
}

function updateCustomerCartUI() {
    const totalCount = ShriMelan.cart.reduce((sum, c) => sum + c.qty, 0);
    document.getElementById("cart-counter").textContent = totalCount;

    const cartContainer = document.getElementById("customer-cart-items-container");
    cartContainer.innerHTML = "";

    if (ShriMelan.cart.length === 0) {
        cartContainer.innerHTML = `<div style="text-align:center; padding: 40px 20px; color:var(--text-secondary);">
            <i data-lucide="shopping-bag" style="width:48px; height:48px; margin: 0 auto 16px;"></i>
            <p>Your table ticket is empty.<br>Click the '+' on menu items to order!</p>
        </div>`;
        document.getElementById("customer-cart-subtotal").textContent = "$0.00";
        document.getElementById("customer-cart-tax").textContent = "$0.00";
        document.getElementById("customer-cart-total").textContent = "$0.00";
        lucide.createIcons();
        return;
    }

    let subtotal = 0;
    ShriMelan.cart.forEach(c => {
        const cost = c.item.Price * c.qty;
        subtotal += cost;

        const row = document.createElement("div");
        row.className = "pos-item-qty-row";
        row.style.margin = "8px 0";
        
        row.innerHTML = `
            <div style="flex:1;">
                <h5 style="font-weight:700;">${c.item.Item_Name}</h5>
                <p style="font-size:0.8rem; color:var(--accent-orange); font-weight:bold;">$${c.item.Price.toFixed(2)} ea</p>
            </div>
            <div class="pos-qty-controls">
                <button class="pos-qty-btn" onclick="adjustCustomerCartQty('${c.item.Item_ID}', -1)">-</button>
                <span class="pos-qty-val">${c.qty}</span>
                <button class="pos-qty-btn" onclick="adjustCustomerCartQty('${c.item.Item_ID}', 1)">+</button>
            </div>
        `;
        cartContainer.appendChild(row);
    });

    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    document.getElementById("customer-cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("customer-cart-tax").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("customer-cart-total").textContent = `$${total.toFixed(2)}`;
    
    const label = document.getElementById("customer-cart-table-label");
    if (ShriMelan.selectedTableForUser) {
        label.textContent = `Seated at Table ${ShriMelan.selectedTableForUser}`;
    } else {
        label.textContent = "Seated Table not linked yet";
    }
    
    lucide.createIcons();
}

function adjustCustomerCartQty(itemId, amount) {
    const cartItem = ShriMelan.cart.find(c => c.item.Item_ID === itemId);
    if (!cartItem) return;

    if (amount > 0) {
        if (cartItem.qty + 1 > cartItem.item.Stock_Qty) {
            alert("No additional stock available!");
            return;
        }
        cartItem.qty++;
    } else {
        cartItem.qty--;
        if (cartItem.qty <= 0) {
            ShriMelan.cart = ShriMelan.cart.filter(c => c.item.Item_ID !== itemId);
        }
    }
    updateCustomerCartUI();
}

// Open / Close Customer Cart Slide drawer
document.getElementById("cart-btn").addEventListener("click", () => {
    document.getElementById("customer-cart-backdrop").classList.add("active");
    updateCustomerCartUI();
});
document.getElementById("customer-cart-close").addEventListener("click", () => {
    document.getElementById("customer-cart-backdrop").classList.remove("active");
});

// Place kitchen order from Cart
document.getElementById("customer-cart-checkout-btn").addEventListener("click", () => {
    if (ShriMelan.cart.length === 0) return;
    
    if (!ShriMelan.selectedTableForUser) {
        // Must select physical table modal first
        document.getElementById("customer-table-modal-backdrop").classList.add("active");
        renderCustomerTableSelector();
    } else {
        submitUserCartToKitchen();
    }
});

function renderCustomerTableSelector() {
    const select = document.getElementById("customer-table-select");
    select.innerHTML = "";
    ShriMelan.tables.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.Table_No;
        opt.textContent = `Table ${t.Table_No} (${t.Status === 'Available' ? 'Available' : 'Currently Dining'})`;
        select.appendChild(opt);
    });
}

document.getElementById("hero-order-table-btn").addEventListener("click", () => {
    document.getElementById("customer-table-modal-backdrop").classList.add("active");
    renderCustomerTableSelector();
});

document.getElementById("customer-table-submit-btn").addEventListener("click", () => {
    const tVal = parseInt(document.getElementById("customer-table-select").value);
    ShriMelan.selectedTableForUser = tVal;
    document.getElementById("customer-table-modal-backdrop").classList.remove("active");
    
    // If cart has elements, push them to kitchen
    if (ShriMelan.cart.length > 0) {
        submitUserCartToKitchen();
    } else {
        alert(`You successfully checked-in and linked Table ${tVal}! Order items from the list below.`);
        updateCustomerCartUI();
    }
});

function submitUserCartToKitchen() {
    const tableNo = ShriMelan.selectedTableForUser;
    const table = ShriMelan.tables.find(t => t.Table_No === tableNo);
    if (!table) return;

    // Convert cart into table active ticket
    const ticketItems = {};
    ShriMelan.cart.forEach(c => {
        ticketItems[c.item.Item_ID] = c.qty;
    });

    table.Status = "Pending"; // Waiter will confirm this ticket draft
    table.ActiveTicket = {
        Items: ticketItems,
        Notes: "Customer Self-Submitted Draft Order",
        StartTime: new Date().toISOString()
    };

    saveState("tables");
    
    // Clear user local cart
    ShriMelan.cart = [];
    ShriMelan.selectedTableForUser = null;
    updateCustomerCartUI();
    
    // Close cart drawer
    document.getElementById("customer-cart-backdrop").classList.remove("active");
    
    alert(`Order sent! A waiter is bringing your drinks, and your table #${tableNo} is now prepared in the kitchen queue.`);
    renderUserMenu();
}

// ==========================================================================
// 5. Admin Portal: Waiter POS Screen Logic
// ==========================================================================
function renderPOSTables() {
    const tableGrid = document.getElementById("pos-tables-grid");
    tableGrid.innerHTML = "";

    ShriMelan.tables.forEach(t => {
        const card = document.createElement("div");
        const statusClass = t.Status.toLowerCase();
        card.className = `table-card ${statusClass}`;
        
        let countText = "Empty";
        if (t.ActiveTicket) {
            const sumQty = Object.values(t.ActiveTicket.Items).reduce((sum, qty) => sum + qty, 0);
            countText = `${sumQty} items ordered`;
        }

        card.innerHTML = `
            <div class="table-number">${t.Table_No}</div>
            <div class="table-meta">
                <h4>Table ${t.Table_No}</h4>
                <p>${countText}</p>
            </div>
            <span class="table-status-pill">${t.Status}</span>
        `;
        
        card.addEventListener("click", () => {
            openPOSDrawer(t.Table_No);
        });

        tableGrid.appendChild(card);
    });
}

function openPOSDrawer(tableNumber) {
    ShriMelan.activePOSTable = tableNumber;
    const table = ShriMelan.tables.find(t => t.Table_No === tableNumber);
    if (!table) return;

    document.getElementById("pos-drawer-title").textContent = `Table ${tableNumber} - Order Ticket`;
    document.getElementById("pos-drawer-subtitle").textContent = `Current Table Status: ${table.Status}`;
    
    // Prepopulate Search Checklist
    renderPOSMenuChecklist(table);
    
    // Prepopulate Quantities List & Prep Notes
    renderPOSSelectedItemsList(table);
    document.getElementById("pos-prep-notes").value = table.ActiveTicket ? table.ActiveTicket.Notes : "";

    // Toggle Payment selection layout: Only active when billing or checking out
    const paymentGroup = document.getElementById("pos-payment-method-group");
    if (table.Status === "Available") {
        paymentGroup.style.display = "none";
    } else {
        paymentGroup.style.display = "block";
    }

    document.getElementById("pos-drawer-backdrop").classList.add("active");
    updatePOSDrawerTotals();
}

function renderPOSMenuChecklist(table) {
    const searchVal = document.getElementById("pos-menu-search").value.toLowerCase();
    const listContainer = document.getElementById("pos-menu-checkboxes-list");
    listContainer.innerHTML = "";

    const activeItems = table.ActiveTicket ? table.ActiveTicket.Items : {};

    const filtered = ShriMelan.menuItems.filter(item => 
        item.Item_Name.toLowerCase().includes(searchVal) || item.Category.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="padding:10px; color:var(--text-secondary); text-align:center;">No catalog items match.</p>`;
        return;
    }

    filtered.forEach(item => {
        const isChecked = activeItems[item.Item_ID] !== undefined;
        const row = document.createElement("div");
        row.className = "pos-menu-item-row";
        
        row.innerHTML = `
            <label class="pos-item-checkbox-label">
                <input type="checkbox" value="${item.Item_ID}" ${isChecked ? 'checked' : ''} onchange="togglePOSTicketItem('${item.Item_ID}', this.checked)">
                <span>${item.Item_Name} (${item.Stock_Qty} left)</span>
            </label>
            <span class="pos-item-price-badge">$${item.Price.toFixed(2)}</span>
        `;
        listContainer.appendChild(row);
    });
}

// Live Search in POS Drawer Checklist
document.getElementById("pos-menu-search").addEventListener("input", () => {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    renderPOSMenuChecklist(table);
});

function togglePOSTicketItem(itemId, isChecked) {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    if (!table) return;

    if (!table.ActiveTicket) {
        table.ActiveTicket = {
            Items: {},
            Notes: "",
            StartTime: new Date().toISOString()
        };
    }

    if (isChecked) {
        const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
        if (item.Stock_Qty <= 0) {
            alert("Warning: This item is out of stock!");
        }
        table.ActiveTicket.Items[itemId] = 1;
    } else {
        delete table.ActiveTicket.Items[itemId];
        if (Object.keys(table.ActiveTicket.Items).length === 0) {
            table.ActiveTicket = null;
        }
    }

    renderPOSSelectedItemsList(table);
    updatePOSDrawerTotals();
}

function renderPOSSelectedItemsList(table) {
    const container = document.getElementById("pos-selected-qtys-container");
    container.innerHTML = "";

    if (!table.ActiveTicket || Object.keys(table.ActiveTicket.Items).length === 0) {
        container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-secondary); font-style:italic;">No dishes checked yet.</p>`;
        return;
    }

    Object.entries(table.ActiveTicket.Items).forEach(([itemId, qty]) => {
        const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
        if (!item) return;

        const row = document.createElement("div");
        row.className = "pos-item-qty-row";
        
        row.innerHTML = `
            <div style="flex:1;">
                <h5 style="font-weight:700;">${item.Item_Name}</h5>
                <p style="font-size:0.8rem; color:var(--accent-orange); font-weight:bold;">$${item.Price.toFixed(2)}</p>
            </div>
            <div class="pos-qty-controls">
                <button class="pos-qty-btn" onclick="adjustPOSItemQty('${itemId}', -1)">-</button>
                <span class="pos-qty-val">${qty}</span>
                <button class="pos-qty-btn" onclick="adjustPOSItemQty('${itemId}', 1)">+</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function adjustPOSItemQty(itemId, amount) {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    if (!table || !table.ActiveTicket) return;

    const currentQty = table.ActiveTicket.Items[itemId] || 0;
    const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);

    if (amount > 0) {
        if (currentQty + 1 > item.Stock_Qty) {
            alert(`Stock limit reached! Only ${item.Stock_Qty} remaining in inventory.`);
            return;
        }
        table.ActiveTicket.Items[itemId] = currentQty + 1;
    } else {
        if (currentQty - 1 <= 0) {
            delete table.ActiveTicket.Items[itemId];
            // Uncheck the list check
            const checkboxes = document.querySelectorAll('#pos-menu-checkboxes-list input[type="checkbox"]');
            checkboxes.forEach(chk => {
                if (chk.value === itemId) chk.checked = false;
            });
        } else {
            table.ActiveTicket.Items[itemId] = currentQty - 1;
        }
    }

    if (Object.keys(table.ActiveTicket.Items).length === 0) {
        table.ActiveTicket = null;
    }

    renderPOSSelectedItemsList(table);
    updatePOSDrawerTotals();
}

function updatePOSDrawerTotals() {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    let subtotal = 0;

    if (table && table.ActiveTicket) {
        Object.entries(table.ActiveTicket.Items).forEach(([itemId, qty]) => {
            const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
            if (item) subtotal += item.Price * qty;
        });
    }

    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    document.getElementById("pos-bill-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("pos-bill-tax").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("pos-bill-total").textContent = `$${total.toFixed(2)}`;
}

// Drawer Action Buttons: Draft vs Checkout Close Table
document.getElementById("pos-save-draft-btn").addEventListener("click", () => {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    if (!table) return;

    if (table.ActiveTicket) {
        table.Status = "Busy";
        table.ActiveTicket.Notes = document.getElementById("pos-prep-notes").value;
    } else {
        table.Status = "Available";
    }

    saveState("tables");
    document.getElementById("pos-drawer-backdrop").classList.remove("active");
    renderPOSTables();
    renderOverviewDashboard();
});

document.getElementById("pos-checkout-btn").addEventListener("click", () => {
    const table = ShriMelan.tables.find(t => t.Table_No === ShriMelan.activePOSTable);
    if (!table || !table.ActiveTicket) {
        alert("Cannot checkout empty table ticket!");
        return;
    }

    // A. Deduct stocks and construct values
    const orderedItems = [];
    const orderedQties = [];
    let subtotal = 0;

    for (const [itemId, qty] of Object.entries(table.ActiveTicket.Items)) {
        const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
        if (item) {
            // Deduct stock
            item.Stock_Qty = Math.max(0, item.Stock_Qty - qty);
            orderedItems.push(item.Item_Name);
            orderedQties.push(qty);
            subtotal += item.Price * qty;
        }
    }

    const tax = subtotal * 0.10;
    const totalRevenue = subtotal + tax;
    const paymentMode = document.querySelector('input[name="pos-payment-mode"]:checked').value;

    const dateObj = new Date();
    const formattedDate = dateObj.toISOString().slice(0,10);
    const monthNo = dateObj.getMonth() + 1;
    const monthName = dateObj.toLocaleString('default', { month: 'long' });

    // B. Build order transaction object
    const newOrder = {
        Order_ID: "TX-" + Math.floor(100000 + Math.random() * 900000),
        Table_No: table.Table_No,
        Timestamp: dateObj.toISOString(),
        Date: formattedDate,
        Month_No: monthNo,
        Month: monthName,
        Items_Ordered: orderedItems,
        Quantities: orderedQties,
        Subtotal: subtotal,
        Tax: tax,
        Total_Revenue: totalRevenue
    };

    ShriMelan.completedOrders.push(newOrder);

    // C. Reset table state
    table.Status = "Available";
    table.ActiveTicket = null;

    // Save states
    saveState("tables");
    saveState("menuItems");
    saveState("completedOrders");

    // Close drawers
    document.getElementById("pos-drawer-backdrop").classList.remove("active");
    
    // Refresh panels
    renderPOSTables();
    renderOverviewDashboard();

    alert(`Table ${table.Table_No} ticket successfully paid ($${totalRevenue.toFixed(2)} via ${paymentMode}) and closed. Table is available again.`);

    // Trigger Cloud Auto-Sync if signed in
    if (window.ShriMelanDrive && window.ShriMelanDrive.isSignedIn()) {
        window.ShriMelanDrive.syncWithGoogleDrive();
    }
});

// Helper modal close links
document.getElementById("pos-drawer-close").addEventListener("click", () => {
    document.getElementById("pos-drawer-backdrop").classList.remove("active");
});

// ==========================================================================
// 6. Admin Portal: Menu Item CRUD Logic
// ==========================================================================
function renderInventoryCRUD() {
    const body = document.getElementById("inventory-table-body");
    body.innerHTML = "";

    ShriMelan.menuItems.forEach(item => {
        const margin = item.Price - item.Cost_to_Make;
        const row = document.createElement("tr");

        let stockClass = "in";
        let stockLabel = "In Stock";
        if (item.Stock_Qty <= 0) {
            stockClass = "out";
            stockLabel = "Sold Out";
        } else if (item.Stock_Qty <= ShriMelan.lowStockThreshold) {
            stockClass = "low";
            stockLabel = `Low (${item.Stock_Qty})`;
        } else {
            stockLabel = `${item.Stock_Qty}`;
        }

        row.innerHTML = `
            <td><strong>${item.Item_ID}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${item.Image_URL}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;">
                    <span style="font-weight:700;">${item.Item_Name}</span>
                </div>
            </td>
            <td>${item.Category}</td>
            <td>$${item.Cost_to_Make.toFixed(2)}</td>
            <td>$${item.Price.toFixed(2)}</td>
            <td style="color:var(--color-success); font-weight:700;">$${margin.toFixed(2)}</td>
            <td><span class="stock-pill ${stockClass}">${stockLabel}</span></td>
            <td>${item.Stock_Qty > 0 ? 'Active' : 'Archived'}</td>
            <td>
                <div class="cell-actions">
                    <button class="btn-icon edit" onclick="openCRUDModal('${item.Item_ID}')">
                        <i data-lucide="edit-3" style="width:16px;"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCRUDItem('${item.Item_ID}')">
                        <i data-lucide="trash-2" style="width:16px;"></i>
                    </button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
    lucide.createIcons();
}

function openCRUDModal(itemId = null) {
    const backdrop = document.getElementById("menu-modal-backdrop");
    const title = document.getElementById("menu-modal-title");
    
    // Clear form inputs
    document.getElementById("form-item-id").value = "";
    document.getElementById("form-item-name").value = "";
    document.getElementById("form-item-category").value = "Burgers";
    document.getElementById("form-item-cost").value = "";
    document.getElementById("form-item-price").value = "";
    document.getElementById("form-item-stock").value = "";
    document.getElementById("form-item-rating").value = "4.5";
    document.getElementById("form-item-desc").value = "";
    document.getElementById("form-item-img").value = "";

    if (itemId) {
        const item = ShriMelan.menuItems.find(m => m.Item_ID === itemId);
        if (item) {
            title.textContent = "Edit Menu Item";
            document.getElementById("form-item-id").value = item.Item_ID;
            document.getElementById("form-item-name").value = item.Item_Name;
            document.getElementById("form-item-category").value = item.Category;
            document.getElementById("form-item-cost").value = item.Cost_to_Make;
            document.getElementById("form-item-price").value = item.Price;
            document.getElementById("form-item-stock").value = item.Stock_Qty;
            document.getElementById("form-item-rating").value = item.Rating;
            document.getElementById("form-item-desc").value = item.Description;
            document.getElementById("form-item-img").value = item.Image_URL;
        }
    } else {
        title.textContent = "Add Menu Item";
    }

    backdrop.classList.add("active");
}

function saveCRUDItem() {
    const idVal = document.getElementById("form-item-id").value;
    const nameVal = document.getElementById("form-item-name").value.trim();
    const catVal = document.getElementById("form-item-category").value;
    const costVal = parseFloat(document.getElementById("form-item-cost").value);
    const priceVal = parseFloat(document.getElementById("form-item-price").value);
    const stockVal = parseInt(document.getElementById("form-item-stock").value);
    const ratingVal = parseFloat(document.getElementById("form-item-rating").value) || 4.5;
    const descVal = document.getElementById("form-item-desc").value.trim();
    const imgVal = document.getElementById("form-item-img").value.trim();

    if (!nameVal || isNaN(costVal) || isNaN(priceVal) || isNaN(stockVal)) {
        alert("Please fill in all mandatory numerical and description fields.");
        return;
    }

    if (idVal) {
        // Edit Mode
        const itemIndex = ShriMelan.menuItems.findIndex(m => m.Item_ID === idVal);
        if (itemIndex > -1) {
            ShriMelan.menuItems[itemIndex] = {
                Item_ID: idVal,
                Item_Name: nameVal,
                Category: catVal,
                Cost_to_Make: costVal,
                Price: priceVal,
                Stock_Qty: stockVal,
                Image_URL: imgVal || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
                Description: descVal || `${nameVal} prepared fresh in-house.`,
                Rating: ratingVal
            };
        }
    } else {
        // Add Mode
        const newId = "Item-" + Math.floor(100 + Math.random() * 900);
        ShriMelan.menuItems.push({
            Item_ID: newId,
            Item_Name: nameVal,
            Category: catVal,
            Cost_to_Make: costVal,
            Price: priceVal,
            Stock_Qty: stockVal,
            Image_URL: imgVal || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
            Description: descVal || `${nameVal} prepared fresh in-house.`,
            Rating: ratingVal
        });
    }

    saveState("menuItems");
    document.getElementById("menu-modal-backdrop").classList.remove("active");
    renderInventoryCRUD();
    renderOverviewDashboard();
    
    // Auto sync
    if (window.ShriMelanDrive && window.ShriMelanDrive.isSignedIn()) {
        window.ShriMelanDrive.syncWithGoogleDrive();
    }
}

function deleteCRUDItem(itemId) {
    if (!confirm("Are you sure you want to permanently delete this item from the active restaurant menu?")) return;

    ShriMelan.menuItems = ShriMelan.menuItems.filter(m => m.Item_ID !== itemId);
    saveState("menuItems");
    renderInventoryCRUD();
    renderOverviewDashboard();

    // Auto sync
    if (window.ShriMelanDrive && window.ShriMelanDrive.isSignedIn()) {
        window.ShriMelanDrive.syncWithGoogleDrive();
    }
}

// Wire CRUD triggers
document.getElementById("add-menu-item-btn").addEventListener("click", () => openCRUDModal());
document.getElementById("menu-modal-close").addEventListener("click", () => {
    document.getElementById("menu-modal-backdrop").classList.remove("active");
});
document.getElementById("menu-form-cancel-btn").addEventListener("click", () => {
    document.getElementById("menu-modal-backdrop").classList.remove("active");
});
document.getElementById("menu-form-save-btn").addEventListener("click", saveCRUDItem);

// ==========================================================================
// 7. Overview Subpage Dashboard Analytics Setup
// ==========================================================================
function renderOverviewDashboard() {
    // 1. KPI Counts
    const activeOrders = ShriMelan.tables.filter(t => t.Status === "Busy" || t.Status === "Billing").length;
    document.getElementById("overview-active-orders-count").textContent = activeOrders;

    const occupiedTables = ShriMelan.tables.filter(t => t.Status !== "Available").length;
    document.getElementById("overview-occupied-tables-count").textContent = `${occupiedTables} / 12`;

    const lowStock = ShriMelan.menuItems.filter(item => item.Stock_Qty <= ShriMelan.lowStockThreshold).length;
    document.getElementById("overview-low-stock-count").textContent = lowStock;

    // 2. Overview Tables list
    const tableContainer = document.getElementById("overview-table-list");
    tableContainer.innerHTML = "";
    
    ShriMelan.tables.forEach(t => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "10px 14px";
        row.style.backgroundColor = "var(--bg-surface)";
        row.style.borderRadius = "8px";
        row.style.border = "1px solid var(--border-color)";

        let icon = '<i data-lucide="check-circle" style="color:var(--color-success);"></i>';
        if (t.Status === "Busy") icon = '<i data-lucide="coffee" style="color:var(--color-danger);"></i>';
        else if (t.Status === "Billing") icon = '<i data-lucide="wallet" style="color:var(--color-warning);"></i>';
        else if (t.Status === "Pending") icon = '<i data-lucide="smartphone" style="color:var(--table-pending);"></i>';

        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                ${icon}
                <span style="font-weight:700;">Table ${t.Table_No}</span>
            </div>
            <span style="font-size:0.8rem; font-weight:bold; color:var(--text-secondary);">${t.Status}</span>
        `;
        tableContainer.appendChild(row);
    });

    // 3. Overview Recent completed transactions list
    const recContainer = document.getElementById("overview-recent-orders-list");
    recContainer.innerHTML = "";

    const sortedOrders = [...ShriMelan.completedOrders]
        .sort((a,b) => new Date(b.Timestamp) - new Date(a.Timestamp))
        .slice(0, 5);

    if (sortedOrders.length === 0) {
        recContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding: 20px;">No completed sales transactions logged.</p>`;
        lucide.createIcons();
        return;
    }

    sortedOrders.forEach(ord => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "10px 14px";
        row.style.backgroundColor = "var(--bg-surface)";
        row.style.borderRadius = "8px";
        row.style.border = "1px solid var(--border-color)";

        row.innerHTML = `
            <div>
                <span style="font-weight:700; font-family:var(--font-heading); color:var(--accent-orange);">${ord.Order_ID}</span>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Table ${ord.Table_No} | ${ord.Items_Ordered.length} Items</div>
            </div>
            <span style="font-weight:800; color:var(--text-primary);">$${ord.Total_Revenue.toFixed(2)}</span>
        `;
        recContainer.appendChild(row);
    });
    lucide.createIcons();
}

function refreshAdminPortal() {
    renderOverviewDashboard();
    renderPOSTables();
    renderInventoryCRUD();
    if (window.ShriMelanAnalytics) {
        window.ShriMelanAnalytics.updateAnalytics();
    }
}

// ==========================================================================
// 8. Setup Common Modals Routing Events
// ==========================================================================
function setupModalsAndDrawers() {
    // Backdrop close handlers
    window.addEventListener("click", (e) => {
        if (e.target.className === "drawer-backdrop") {
            e.target.classList.remove("active");
        }
        if (e.target.className === "modal-backdrop") {
            e.target.classList.remove("active");
        }
    });

    document.getElementById("customer-table-modal-close").addEventListener("click", () => {
        document.getElementById("customer-table-modal-backdrop").classList.remove("active");
    });
    document.getElementById("customer-table-cancel-btn").addEventListener("click", () => {
        document.getElementById("customer-table-modal-backdrop").classList.remove("active");
    });
}

// Export States globally
window.ShriMelan = ShriMelan;
window.refreshAdminPortal = refreshAdminPortal;

// Load App
window.addEventListener("DOMContentLoaded", initApp);
