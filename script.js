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
    }

    t.innerText = msg;
    t.style.display = "block";
    t.style.background = success ? "#22c55e" : "#ef4444";

    setTimeout(() => {
        t.style.display = "none";
    }, 2500);
}

/* ================= LOADING BUTTON ================= */
function setLoading(btn, state, text = "Loading...") {
    if (!btn) return;

    if (state) {
        btn.disabled = true;
        btn.dataset.original = btn.innerText;
        btn.innerText = text;
    } else {
        btn.disabled = false;
        btn.innerText = btn.dataset.original || "Submit";
    }
}

/* ================= SAFE FETCH ================= */
async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Request failed");

        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/* ================= LOGIN ================= */
async function login() {
    const btn = document.querySelector("button[onclick='login()']");

    const email = document.getElementById("email")?.value;
    const phone = document.getElementById("phone")?.value;
    const password = document.getElementById("password")?.value;

    setLoading(btn, true, "Logging in...");

    try {
        const res = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, phone, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Login failed");

        localStorage.setItem("token", data.token);

        toast("Login successful ✅");
        setTimeout(() => (location.href = "dashboard.html"), 800);

    } catch (err) {
        toast(err.message, false);
    }

    setLoading(btn, false);
}

/* ================= REGISTER ================= */
async function register() {
    const btn = document.querySelectorAll("button")[1];

    const email = document.getElementById("email")?.value;
    const phone = document.getElementById("phone")?.value;
    const password = document.getElementById("password")?.value;

    setLoading(btn, true, "Creating account...");

    try {
        const res = await fetch(API + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, phone, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Register failed");

        toast("Account created ✅");

    } catch (err) {
        toast(err.message, false);
    }

    setLoading(btn, false);
}

/* ================= USER ================= */
async function loadUser() {
    const data = await safeFetch(API + "/me", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    const email = document.getElementById("email");
    const balance = document.getElementById("balance");

    if (email) email.innerText = data.email || "User";
    if (balance) balance.innerText = data.balance || 0;
}

/* ================= SERVICES ================= */
async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    container.innerHTML = "<p>Loading services...</p>";

    const data = await safeFetch(API + "/services");

    if (!data || !data.data) {
        container.innerHTML = "<p style='color:red'>Failed to load services</p>";
        return;
    }

    container.innerHTML = "";

    Object.values(data.data).forEach(group => {
        group.forEach(s => {
            const div = document.createElement("div");
            div.className = "service";

            div.innerHTML = `
                <b>${s.name}</b><br>
                Rate: ${s.rate}<br>
                Min: ${s.min} | Max: ${s.max}<br><br>
                <button onclick="order('${s.serviceId}')">Order</button>
            `;

            container.appendChild(div);
        });
    });
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

    toast("Order placed successfully ✅");

    loadOrders();
    loadUser();
}

/* ================= ORDERS ================= */
async function loadOrders() {
    const table = document.getElementById("orderTable");
    if (!table) return;

    const data = await safeFetch(API + "/orders", {
        headers: { Authorization: "Bearer " + getToken() }
    });

    if (!data) return;

    table.innerHTML = "";

    data.forEach(o => {
        table.innerHTML += `
            <tr>
                <td>${o._id}</td>
                <td>${o.service}</td>
                <td>${o.quantity}</td>
                <td>${o.status || "pending"}</td>
            </tr>
        `;
    });
}

/* ================= LOGOUT ================= */
function logout() {
    localStorage.removeItem("token");
    location.href = "index.html";
}

/* ================= STEP FLOW (ORDER PAGE) ================= */
function showStep(step) {
    document.querySelectorAll(".step-container").forEach(s => {
        s.style.display = "none";
    });

    const el = document.getElementById("step-" + step);
    if (el) el.style.display = "block";
}

function setAmount(val) {
    const pricePerUnit = 0.02;
    const priceEl = document.getElementById("price");

    if (!priceEl) return;

    priceEl.innerText = (val * pricePerUnit).toFixed(2);
}

/* ================= SERVICE PAGE (?serviceId=) ================= */
let currentService = null;

function getServiceId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("serviceId");
}

async function loadService() {
    const id = getServiceId();
    if (!id) return;

    const res = await fetch(API + "/services");
    const data = await res.json();

    if (!data || !data.data) return;

    let allServices = [];

    Object.values(data.data).forEach(group => {
        group.forEach(s => allServices.push(s));
    });

    currentService = allServices.find(s => s.serviceId === id);

    const box = document.getElementById("serviceInfo");
    if (!box) return;

    if (!currentService) {
        box.innerHTML = "Service not found";
        return;
    }

    box.innerHTML = `
        <h3>${currentService.name}</h3>
        <p>Price: ${currentService.rate} KSH / 1000</p>
    `;
}

/* ================= INIT ================= */
window.onload = () => {
    if (!getToken()) {
        location.href = "index.html";
        return;
    }

    loadUser();
    loadServices();
    loadOrders();
    loadService();
};
