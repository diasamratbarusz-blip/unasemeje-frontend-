/* ================= CONFIGURATION ================= */
const API = "https://unasemeje-backend-3.onrender.com/api";
const token = localStorage.getItem("token");

// Redirect to login if no token is found
if (!token) {
  window.location.href = "index.html";
}

/* ================= STATE MANAGEMENT ================= */
let servicesData = [];
let selectedService = null;

/* ================= API HEADERS ================= */
function headers() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}

/* ================= ADMIN SECURITY GATE ================= */
/**
 * Verifies if the logged-in user is the administrator.
 * Only grants access to the specified email or phone.
 */
function checkAdminAccess(user) {
    const ADMIN_EMAIL = "diasamratbarusz@gmail.com";
    const ADMIN_PHONE = "0715509440";

    const isOwner = user.email === ADMIN_EMAIL || user.phone === ADMIN_PHONE;

    if (isOwner) {
        // Add the class to body to override 'display: none !important' in style.css
        document.body.classList.add('is-admin');
        
        // Manual backup to ensure the element is visible
        const adminBtn = document.getElementById("adminMenu");
        if (adminBtn) adminBtn.style.display = "flex";
        
        console.log("Admin security gate: Owner Verified.");
    }
}

/* ================= USER DATA & BALANCE ================= */
async function loadUser() {
  try {
    const res = await fetch(`${API}/me`, { headers: headers() });
    const data = await res.json();

    if (!res.ok) {
      if(res.status === 401) logout();
      throw new Error("User load failed");
    }

    // Security Gate: Check if current user is the owner
    checkAdminAccess(data);

    // Update balance across the UI with Kenyan formatting
    const balanceEl = document.getElementById("balance") || document.getElementById("userBalance");
    if (balanceEl) {
      const balanceValue = Number(data.balance || 0).toLocaleString('en-KE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      // If using the dashboard-specific 'userBalance' ID, add the KES prefix
      balanceEl.innerText = (balanceEl.id === "userBalance") ? `KES ${balanceValue}` : balanceValue;
    }

    // Load user-specific info like Referral Code or Username
    const refCodeEl = document.getElementById("referralCodeDisplay") || document.getElementById("myRefCode");
    if (refCodeEl && data.referralCode) {
        refCodeEl.innerText = data.referralCode;
        localStorage.setItem("refCode", data.referralCode);
    }

    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    
    if (userNameEl) userNameEl.innerText = data.username || "User";
    if (userEmailEl) userEmailEl.innerText = data.email || "";

  } catch (err) {
    console.error("User load error:", err);
  }
}

/* ================= SERVICES PROCESSING ================= */
function normalizeServices(json) {
  let services = [];

  if (Array.isArray(json)) {
    services = json;
  }
  else if (json?.data && Array.isArray(json.data)) {
    services = json.data;
  }
  else if (json?.data && typeof json.data === "object") {
    Object.entries(json.data).forEach(([platform, groups]) => {
      Object.entries(groups).forEach(([category, list]) => {
        if (Array.isArray(list)) {
          list.forEach(s => {
            services.push({
              ...s,
              platform: platform || s.platform,
              category: category || s.category
            });
          });
        }
      });
    });
  }
  return services;
}

async function loadServices() {
  const container = document.getElementById("services") || document.getElementById("servicesList");
  if (container) container.innerHTML = `<div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Loading Services...</div>`;

  try {
    const res = await fetch(`${API}/services`);
    const json = await res.json();

    if (!res.ok) throw new Error("Services fetch failed");

    servicesData = normalizeServices(json);
    renderServices();

  } catch (err) {
    console.error("Services error:", err);
    if (typeof showToast === "function") showToast("Failed to load services.", "error");
  }
}

/* ================= UI RENDERING ================= */
function renderServices() {
  const container = document.getElementById("services") || document.getElementById("servicesList");
  if (!container) return;

  const search = document.getElementById("search")?.value?.toLowerCase() || "";
  const filter = document.getElementById("platformFilter")?.value || "all";

  container.innerHTML = "";

  const filtered = servicesData.filter(s => {
    const matchPlatform = filter === "all" || s.platform === filter;
    const matchSearch = !search || String(s.name).toLowerCase().includes(search) || String(s.category).toLowerCase().includes(search);
    return matchPlatform && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:20px; color: #94a3b8; text-align:center;">No services found matching your search.</div>`;
    return;
  }

  filtered.forEach(s => {
    const div = document.createElement("div");
    div.className = "service-card"; 
    
    div.innerHTML = `
      <div class="service-info">
        <div class="platform-icon">${getIcon(s.platform)}</div>
        <div class="details">
          <b class="s-name">${s.name}</b>
          <p class="s-cat">${s.category || "General Service"}</p>
          <small class="s-id">ID: ${s.serviceId}</small>
        </div>
      </div>
      <div class="service-price">
        <span class="price">KES ${Number(s.rate).toFixed(2)}</span>
        <small>per 1,000</small>
      </div>
    `;

    div.onclick = () => selectService(s);
    container.appendChild(div);
  });
}

function getIcon(platform) {
    const p = String(platform).toLowerCase();
    if (p.includes("insta")) return '<i class="fab fa-instagram" style="color:#e1306c"></i>';
    if (p.includes("tik")) return '<i class="fab fa-tiktok" style="color:#fff"></i>';
    if (p.includes("face")) return '<i class="fab fa-facebook" style="color:#1877f2"></i>';
    if (p.includes("youtube")) return '<i class="fab fa-youtube" style="color:#ff0000"></i>';
    if (p.includes("telegram")) return '<i class="fab fa-telegram" style="color:#0088cc"></i>';
    return '<i class="fas fa-globe" style="color:#10b981"></i>';
}

/* ================= ORDER LOGIC ================= */
function selectService(service) {
  selectedService = service;

  const idInput = document.getElementById("serviceId");
  if (idInput) idInput.value = service.serviceId;

  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  
  const nameDisplay = document.getElementById("selectedServiceName");
  if (nameDisplay) nameDisplay.innerText = service.name;

  document.querySelector(".order-box")?.scrollIntoView({
    behavior: "smooth", block: "center"
  });

  calculatePrice();
}

function calculatePrice() {
  const qtyInput = document.getElementById("quantity");
  const totalEl = document.getElementById("total");
  
  if (!selectedService || !qtyInput) return;

  const qty = Number(qtyInput.value || 0);
  const price = (Number(selectedService.rate) / 1000) * qty;

  if (totalEl) {
    totalEl.innerText = price.toLocaleString('en-KE', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " KES";
  }
}

async function placeOrder() {
  const serviceId = document.getElementById("serviceId")?.value;
  const link = document.getElementById("link")?.value;
  const quantity = document.getElementById("quantity")?.value;
  const btn = document.querySelector(".btn-order");

  if (!serviceId || !link || !quantity) {
    if (typeof showToast === "function") showToast("Please enter link and quantity", "error");
    return;
  }

  try {
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    const res = await fetch(`${API}/order`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        serviceId,
        link,
        quantity: Number(quantity)
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Order failed");

    if (typeof showToast === "function") showToast("Order placed successfully! 🚀", "success");

    loadUser(); 
    resetOrderFields();

  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  } finally {
    if(btn) {
        btn.disabled = false;
        btn.innerText = "Place Order";
    }
  }
}

function resetOrderFields() {
  const fields = ["serviceId", "link", "quantity"];
  fields.forEach(f => {
      const el = document.getElementById(f);
      if(el) el.value = "";
  });
  
  const totalDisplay = document.getElementById("total");
  if (totalDisplay) totalDisplay.innerText = "0.00 KES";
  
  const nameDisplay = document.getElementById("selectedServiceName");
  if (nameDisplay) nameDisplay.innerText = "None Selected";
  
  selectedService = null;
}

/* ================= UTILS ================= */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.style.background = type === "success" ? "#10b981" : "#ef4444";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

/* ================= EVENT LISTENERS ================= */
document.addEventListener("input", (e) => {
  if (e.target.id === "search" || e.target.id === "platformFilter") {
    renderServices();
  }

  if (e.target.id === "quantity") {
    calculatePrice();
  }
});

/* ================= INITIALIZATION ================= */
window.onload = () => {
  loadUser();
  loadServices();
  
  // Auto-refresh balance and user info every 2 minutes
  setInterval(loadUser, 120000);
};
