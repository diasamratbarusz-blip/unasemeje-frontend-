/**
 * =========================================
 * UNASEMEJE ø DIA - Core Frontend Logic
 * =========================================
 */

// ✅ SMART API DETECTION
const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "/api"; 

/* ================= AUTH HELPERS ================= */
function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.clear(); // Clear all data including tokens
    window.location.href = "index.html";
}

/* ================= ADMIN SECURITY GATE ================= */
/**
 * Strictly controls visibility of the Admin Panel.
 * Only grants access to the specified email and phone number.
 */
function checkAdminSecurity(user) {
    const ADMIN_EMAIL = "diasamratbarusz@gmail.com";
    const ADMIN_PHONE = "0715509440";

    const isOwner = user.email === ADMIN_EMAIL || user.phone === ADMIN_PHONE;

    if (isOwner) {
        // 1. Add class to body to trigger style.css rules
        document.body.classList.add('is-admin');
        
        // 2. Manual fallback to ensure the link shows
        const adminBtn = document.getElementById("adminMenu");
        if (adminBtn) adminBtn.style.display = "flex";
        
        console.log("Admin security gate: Access Granted.");
    } else {
        // Redirect unauthorized users away from admin pages
        if (window.location.pathname.includes("admin.html")) {
            window.location.href = "dashboard.html";
        }
    }
}

/* ================= PREMIUM TOAST (Neon Style) ================= */
function toast(msg, success = true) {
    let t = document.getElementById("toast");

    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        document.body.appendChild(t);

        Object.assign(t.style, {
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 24px",
            borderRadius: "16px",
            color: "white",
            zIndex: "10000",
            fontSize: "15px",
            fontWeight: "700",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            transition: "all 0.4s ease",
            textAlign: "center",
            minWidth: "250px"
        });
    }

    t.innerText = msg;
    t.style.background = success ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #b91c1c)";
    t.style.display = "block";
    t.style.opacity = "1";

    setTimeout(() => {
        t.style.opacity = "0";
        setTimeout(() => { t.style.display = "none"; }, 400);
    }, 3000);
}

/* ================= SAFE FETCH ENGINE ================= */
async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        
        if (res.status === 401) {
            logout();
            return null;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

/* ================= USER & PROFILE ================= */
async function loadUser() {
    const data = await safeFetch(API + "/me", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    // Security Gate Check
    checkAdminSecurity(data);

    // Elements on dashboard/nav
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const balanceEl = document.getElementById("userBalance") || document.getElementById("balance");
    const refCodeEl = document.getElementById("myRefCode");

    if (nameEl) nameEl.innerText = data.username || "User";
    if (emailEl) emailEl.innerText = data.email;
    if (balanceEl) {
        const formattedBalance = Number(data.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
        balanceEl.innerText = (balanceEl.id === "userBalance") ? `KES ${formattedBalance}` : formattedBalance;
    }
    if (refCodeEl) refCodeEl.innerText = data.referralCode || "N/A";
    
    // Store refCode for use in referral logic
    localStorage.setItem("refCode", data.referralCode);
}

/* ================= SERVICES LOGIC ================= */
let ALL_SERVICES = [];

function normalizeServices(data) {
    let services = [];
    if (data?.data && typeof data.data === "object") {
        Object.values(data.data).forEach(platformGroup => {
            Object.values(platformGroup).forEach(categoryList => {
                if (Array.isArray(categoryList)) services.push(...categoryList);
            });
        });
    } else if (Array.isArray(data)) {
        services = data;
    }
    return services;
}

async function loadServices() {
    const container = document.getElementById("servicesList");
    if (!container) return;

    container.innerHTML = `<div class="loading-spinner">Fetching services...</div>`;

    const data = await safeFetch(API + "/services");
    if (!data) {
        container.innerHTML = "<p style='color:#ef4444'>Failed to load services. Please refresh.</p>";
        return;
    }

    ALL_SERVICES = normalizeServices(data);
    renderServices();
}

function renderServices(filter = "") {
    const container = document.getElementById("servicesList");
    if (!container) return;

    container.innerHTML = "";
    const query = filter.toLowerCase();

    const filtered = ALL_SERVICES.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.platform && s.platform.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
        container.innerHTML = "<p>No services found matching your search.</p>";
        return;
    }

    filtered.forEach(s => {
        const div = document.createElement("div");
        div.className = "service-card";
        div.innerHTML = `
            <div class="service-platform">${s.platform || "SMM"}</div>
            <div class="service-name">${s.name}</div>
            <div class="service-meta">
                <span><i class="fas fa-tag"></i> KES ${Number(s.rate).toFixed(2)} /1k</span>
                <span><i class="fas fa-layer-group"></i> Min: ${s.min}</span>
            </div>
            <button class="btn-primary" onclick="orderNow('${s.serviceId}', '${encodeURIComponent(s.name)}', ${s.rate})" style="padding: 10px; font-size: 13px;">
                Select Service
            </button>
        `;
        container.appendChild(div);
    });
}

function searchServices(val) {
    renderServices(val);
}

/* ================= ORDERING ENGINE ================= */
function orderNow(id, name, rate) {
    window.location.href = `platform.html?id=${id}&name=${name}&rate=${rate}`;
}

/* ================= ORDER HISTORY ================= */
async function loadOrders() {
    const tableBody = document.getElementById("ordersTableBody");
    const activeOrdersEl = document.getElementById("activeOrders");
    const totalSpentEl = document.getElementById("totalSpent");
    
    if (!tableBody && !activeOrdersEl) return;

    const data = await safeFetch(API + "/sync-orders", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    // Update Dashboard Stats if elements exist
    if (activeOrdersEl) {
        const activeCount = data.filter(o => o.status === 'pending' || o.status === 'processing').length;
        activeOrdersEl.innerText = activeCount;
    }
    if (totalSpentEl) {
        const spent = data.reduce((acc, curr) => acc + (curr.cost || 0), 0);
        totalSpentEl.innerText = "KES " + spent.toFixed(2);
    }

    // Update Table if it exists
    if (tableBody) {
        tableBody.innerHTML = "";
        data.forEach(o => {
            const tr = document.createElement("tr");
            const statusClass = `status-${o.status.toLowerCase()}`;
            
            tr.innerHTML = `
                <td>#${o.orderId}</td>
                <td>${o.serviceName || "SMM Service"}</td>
                <td>${o.quantity}</td>
                <td>KES ${o.cost}</td>
                <td><span class="badge ${statusClass}">${o.status.toUpperCase()}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

/* ================= BOOTSTRAP ================= */
window.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    const isAuthPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    if (!token && !isAuthPage) {
        window.location.href = "index.html";
        return;
    }

    if (token) {
        loadUser();
        loadServices();
        loadOrders();
    }
});
