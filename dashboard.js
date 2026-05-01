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

/* ================= USER DATA & BALANCE ================= */
async function loadUser() {
  try {
    const res = await fetch(`${API}/me`, { headers: headers() });
    const data = await res.json();

    if (!res.ok) throw new Error("User load failed");

    // Update balance across the UI
    const balanceEl = document.getElementById("balance");
    if (balanceEl) {
      balanceEl.innerText = Number(data.balance || 0).toLocaleString('en-KE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }

    // Load user-specific info like Referral Code if element exists
    const refCodeEl = document.getElementById("referralCodeDisplay");
    if (refCodeEl && data.referralCode) {
        refCodeEl.innerText = data.referralCode;
    }

  } catch (err) {
    console.error("User load error:", err);
  }
}

/* ================= SERVICES PROCESSING ================= */
function normalizeServices(json) {
  let services = [];

  // Support for both flat arrays and grouped platform objects
  if (Array.isArray(json)) {
    services = json;
  }
  else if (json?.data && Array.isArray(json.data)) {
    services = json.data;
  }
  else if (json?.data && typeof json.data === "object") {
    Object.entries(json.data).forEach(([platform, groups]) => {
      // Process nested categories (e.g., Platform -> Category -> Services)
      Object.entries(groups).forEach(([category, list]) => {
        if (Array.isArray(list)) {
          list.forEach(s => {
            services.push({
              ...s,
              platform,
              category
            });
          });
        }
      });
    });
  }
  return services;
}

async function loadServices() {
  try {
    const res = await fetch(`${API}/services`);
    const json = await res.json();

    if (!res.ok) throw new Error("Services fetch failed");

    servicesData = normalizeServices(json);
    renderServices();

  } catch (err) {
    console.error("Services error:", err);
    showToast("Failed to load services. Please refresh.", "error");
  }
}

/* ================= UI RENDERING ================= */
function renderServices() {
  const container = document.getElementById("services");
  if (!container) return;

  const search = document.getElementById("search")?.value?.toLowerCase() || "";
  const filter = document.getElementById("platformFilter")?.value || "all";

  container.innerHTML = "";

  servicesData.forEach(s => {
    // Apply filters and search logic
    if (filter !== "all" && s.platform !== filter) return;
    if (search && !String(s.name).toLowerCase().includes(search)) return;

    const div = document.createElement("div");
    div.className = "service";
    
    // unasemeje ø dia specific styling for service cards
    div.innerHTML = `
      <div class="service-header">
        <b>${s.name}</b>
        <span class="badge">${s.platform || "Social"}</span>
      </div>
      <small>ID: ${s.serviceId}</small><br>
      <div class="price-tag">
        KES ${Number(s.rate).toFixed(2)} <small>/1k</small>
      </div>
    `;

    div.onclick = () => selectService(s);
    container.appendChild(div);
  });
}

/* ================= ORDER LOGIC ================= */
function selectService(service) {
  selectedService = service;

  const idInput = document.getElementById("serviceId");
  if (idInput) idInput.value = service.serviceId;

  // Auto-scroll to order section
  document.querySelector(".order-box")?.scrollIntoView({
    behavior: "smooth"
  });

  calculatePrice();
}

function calculatePrice() {
  if (!selectedService) return;

  const qty = Number(document.getElementById("quantity")?.value || 0);
  const price = (Number(selectedService.rate) / 1000) * qty;

  const totalEl = document.getElementById("total");
  if (totalEl) {
    totalEl.innerText = price.toLocaleString('en-KE', { minimumFractionDigits: 2 }) + " KES";
  }
}

async function placeOrder() {
  const serviceId = document.getElementById("serviceId")?.value;
  const link = document.getElementById("link")?.value;
  const quantity = document.getElementById("quantity")?.value;

  if (!serviceId || !link || !quantity) {
    showToast("Please fill all fields", "error");
    return;
  }

  try {
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

    showToast("Order placed successfully! 🚀", "success");

    loadUser(); // Update balance
    resetOrderFields();

  } catch (err) {
    showToast(err.message, "error");
  }
}

function resetOrderFields() {
  const linkField = document.getElementById("link");
  const qtyField = document.getElementById("quantity");
  const totalDisplay = document.getElementById("total");

  if (linkField) linkField.value = "";
  if (qtyField) qtyField.value = "";
  if (totalDisplay) totalDisplay.innerText = "0.00 KES";
}

/* ================= DEPOSIT LOGIC ================= */
async function submitMpesaCode() {
    const message = document.getElementById("mpesaMessage")?.value;
    const amount = document.getElementById("depositAmount")?.value;

    if (!message || !amount) {
        showToast("Please enter amount and paste M-Pesa message", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/deposit`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ message, amount })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        showToast("Payment submitted for approval!", "success");
        document.getElementById("mpesaMessage").value = "";
        document.getElementById("depositAmount").value = "";
    } catch (err) {
        showToast(err.message, "error");
    }
}

/* ================= UTILS ================= */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.style.background = type === "success" ? "#22c55e" : "#ef4444";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
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
  
  // Optional: Auto-refresh balance every 60 seconds
  setInterval(loadUser, 60000);
};
