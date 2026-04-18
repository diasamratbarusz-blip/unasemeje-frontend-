const API = "https://unasemeje-backend-3.onrender.com/api";

/* ================= TOKEN ================= */
function getToken() {
    return localStorage.getItem("token");
}

/* ================= TOAST ================= */
function toast(msg, success = true) {
    let t = document.getElementById("toast");

    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        document.body.appendChild(t);

        t.style.position = "fixed";
        t.style.bottom = "20px";
        t.style.left = "50%";
        t.style.transform = "translateX(-50%)";
        t.style.padding = "10px 15px";
        t.style.borderRadius = "8px";
        t.style.color = "white";
        t.style.zIndex = "9999";
        t.style.fontSize = "14px";
    }

    t.innerText = msg;
    t.style.background = success ? "#22c55e" : "#ef4444";
    t.style.display = "block";

    setTimeout(() => {
        t.style.display = "none";
    }, 2500);
}

/* ================= SAFE FETCH ================= */
async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Request failed");

        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

/* ================= USER ================= */
async function loadUser() {
    const data = await safeFetch(API + "/me", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    const emailEl = document.getElementById("userEmail");
    const balanceEl = document.getElementById("balance");

    if (emailEl) emailEl.innerText = data.email || "User";
    if (balanceEl) balanceEl.innerText = data.balance || 0;
}

/* ================= NORMALIZE SERVICES ================= */
function normalizeServices(data) {
    let services = [];

    if (Array.isArray(data)) {
        services = data;
    }
    else if (data?.data && Array.isArray(data.data)) {
        services = data.data;
    }
    else if (data?.data && typeof data.data === "object") {
        Object.values(data.data).forEach(group => {
            if (Array.isArray(group)) {
                services.push(...group);
            }
        });
    }

    return services;
}

/* ================= SERVICES ================= */
let ALL_SERVICES = [];

async function loadServices() {
    const container = document.getElementById("servicesList");
    if (!container) return;

    container.innerHTML = "<p>Loading services...</p>";

    const data = await safeFetch(API + "/services");

    if (!data) {
        container.innerHTML = "<p style='color:red'>Failed to load services</p>";
        return;
    }

    ALL_SERVICES = normalizeServices(data);

    renderServices();
}

/* ================= RENDER SERVICES ================= */
function renderServices(filter = "") {
    const container = document.getElementById("servicesList");
    if (!container) return;

    container.innerHTML = "";

    const query = filter.toLowerCase();

    ALL_SERVICES.forEach(s => {
        if (query && !s.name.toLowerCase().includes(query)) return;

        const div = document.createElement("div");
        div.className = "service";

        div.innerHTML = `
            <b>${s.name}</b><br>
            Platform: ${s.platform || "Other"}<br>
            Rate: ${Number(s.rate).toFixed(2)}<br>
            Min: ${s.min} | Max: ${s.max}<br><br>
            <button onclick="order('${s.serviceId}')">Order</button>
        `;

        container.appendChild(div);
    });
}

/* ================= SEARCH SERVICES ================= */
function searchServices(val) {
    renderServices(val);
}

/* ================= ORDER ================= */
async function order(serviceId) {
    const link = prompt("Enter link:");
    const qty = prompt("Enter quantity:");

    if (!link || !qty) return;

    const data = await safeFetch(API + "/order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify({
            serviceId,
            link,
            quantity: Number(qty)
        })
    });

    if (!data) {
        toast("Order failed ❌", false);
        return;
    }

    toast("Order placed ✅");

    loadOrders();
    loadUser();
}

/* ================= ORDERS ================= */
async function loadOrders() {
    const table = document.getElementById("ordersList");
    if (!table) return;

    const data = await safeFetch(API + "/orders", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    table.innerHTML = "";

    data.forEach(o => {
        const li = document.createElement("li");
        li.innerText = `${o.service} | Qty: ${o.quantity} | Cost: ${o.cost}`;
        table.appendChild(li);
    });
}

/* ================= STEP FLOW ================= */
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => {
        p.style.display = "none";
    });

    const el = document.getElementById(page);
    if (el) el.style.display = "block";
}

/* ================= LOGIN CHECK ================= */
window.onload = () => {
    if (!getToken()) {
        location.href = "index.html";
        return;
    }

    loadUser();
    loadServices();
    loadOrders();
};
