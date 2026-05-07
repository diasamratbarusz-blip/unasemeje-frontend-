/**
 * =========================================
 * UNASEMEJE ø DIA - Core Frontend Logic
 * =========================================
 */

// ✅ SMART API DETECTION
// Automatically switches between local testing and production Render URL
const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "/api"; // In production, it uses the same domain (better for CORS)

/* ================= AUTH HELPERS ================= */
function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}

/* ================= PREMIUM TOAST (Neon Style) ================= */
function toast(msg, success = true) {
    let t = document.getElementById("toast");

    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        document.body.appendChild(t);

        // Styling the toast for a premium, high-quality look
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
    // Neon Green for success, Neon Red for failure
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
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) logout(); // Session expired
            throw new Error(data.error || "Request failed");
        }

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

    // Elements on dashboard/nav
    const emailEl = document.getElementById("userEmail");
    const balanceEl = document.getElementById("balance");
    const refCodeEl = document.getElementById("myRefCode");

    if (emailEl) emailEl.innerText = data.username || data.email;
    if (balanceEl) balanceEl.innerText = Number(data.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
    if (refCodeEl) refCodeEl.innerText = data.referralCode || "N/A";
}

/* ================= SERVICES LOGIC ================= */
let ALL_SERVICES = [];

function normalizeServices(data) {
    let services = [];
    // Handles the grouped structure (Platform > Category > Services)
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
        s.platform.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = "<p>No services found matching your search.</p>";
        return;
    }

    filtered.forEach(s => {
        const div = document.createElement("div");
        div.className = "service-card"; // Make sure your CSS matches this class
        div.innerHTML = `
            <div class="service-platform">${s.platform || "SMM"}</div>
            <div class="service-name">${s.name}</div>
            <div class="service-meta">
                <span><i class="fas fa-tag"></i> KES ${Number(s.rate).toFixed(2)} /1k</span>
                <span><i class="fas fa-layer-group"></i> Min: ${s.min}</span>
            </div>
            <button class="order-btn-sm" onclick="orderNow('${s.serviceId}', '${encodeURIComponent(s.name)}', ${s.rate})">
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
    // Redirects to the beautiful order page we created
    window.location.href = `/order?id=${id}&name=${name}&rate=${rate}`;
}

/* ================= ORDER HISTORY ================= */
async function loadOrders() {
    const tableBody = document.getElementById("ordersTableBody");
    if (!tableBody) return;

    // Sync with provider first to get latest status
    await safeFetch(API + "/sync-orders", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    const data = await safeFetch(API + "/sync-orders", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    tableBody.innerHTML = "";

    data.forEach(o => {
        const tr = document.createElement("tr");
        const statusClass = `status-${o.status.toLowerCase()}`;
        
        tr.innerHTML = `
            <td>#${o.orderId}</td>
            <td>${o.serviceName || "SMM Service"}</td>
            <td>${o.quantity}</td>
            <td>KES ${o.cost}</td>
            <td><span class="status-badge ${statusClass}">${o.status.toUpperCase()}</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

/* ================= NAVIGATION & BOOT ================= */
function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.style.display = "none";
    });
    const target = document.getElementById(pageId);
    if (target) target.style.display = "block";
}

// RUN ON LOAD
window.onload = () => {
    const token = getToken();
    const isLoginPage = window.location.pathname === "/" || window.location.pathname.includes("index");

    if (!token && !isLoginPage) {
        window.location.href = "/";
        return;
    }

    if (token) {
        loadUser();
        loadServices();
        loadOrders();
    }
};
