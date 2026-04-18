// ================= API =================
const API = "https://unasemeje-backend-3.onrender.com/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

// ================= GLOBAL STATE =================
let servicesData = [];
let selectedService = null;

// ================= AUTH HEADER =================
function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token
  };
}

// ================= LOAD USER =================
async function loadUser() {
  try {
    const res = await fetch(API + "/me", { headers: headers() });
    const data = await res.json();

    document.getElementById("balance").innerText =
      Number(data.balance || 0).toFixed(2);

  } catch (err) {
    console.error("User load error", err);
  }
}

// ================= LOAD SERVICES =================
async function loadServices() {
  try {
    const res = await fetch(API + "/services");
    const json = await res.json();

    // backend returns grouped: { Instagram: [], TikTok: [] }
    servicesData = [];

    Object.keys(json.data || {}).forEach(platform => {
      json.data[platform].forEach(s => {
        servicesData.push({
          ...s,
          platform
        });
      });
    });

    renderServices();

  } catch (err) {
    console.error("Services error:", err);
  }
}

// ================= RENDER SERVICES =================
function renderServices() {
  const container = document.getElementById("services");
  if (!container) return;

  const search = document.getElementById("search")?.value.toLowerCase() || "";
  const filter = document.getElementById("platformFilter")?.value || "all";

  container.innerHTML = "";

  servicesData.forEach(s => {
    if (filter !== "all" && s.platform !== filter) return;
    if (!s.name.toLowerCase().includes(search)) return;

    const div = document.createElement("div");
    div.className = "service";

    div.innerHTML = `
      <b>${s.name}</b><br>
      <small>ID: ${s.serviceId}</small><br>
      <span style="color:#22c55e">KSH ${s.rate}</span>
    `;

    div.onclick = () => selectService(s);

    container.appendChild(div);
  });
}

// ================= SELECT SERVICE =================
function selectService(service) {
  selectedService = service;

  document.getElementById("serviceId").value = service.serviceId;

  // auto scroll to order box (Delix style UX)
  document.querySelector(".order-box")?.scrollIntoView({
    behavior: "smooth"
  });

  calculatePrice();
}

// ================= PRICE CALCULATION =================
function calculatePrice() {
  if (!selectedService) return;

  const qty = Number(document.getElementById("quantity").value || 0);

  const total = (Number(selectedService.rate) / 1000) * qty;

  document.getElementById("total").innerText =
    total.toFixed(2) + " KSH";
}

// ================= PLACE ORDER =================
async function placeOrder() {
  const serviceId = document.getElementById("serviceId").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  if (!serviceId || !link || !quantity) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(API + "/order", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        serviceId,
        link,
        quantity: Number(quantity)
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    alert("Order placed successfully ✅");

    loadUser();

    // reset
    document.getElementById("link").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("total").innerText = "0";

  } catch (err) {
    alert(err.message || "Order failed");
  }
}

// ================= SEARCH / FILTER EVENTS =================
document.addEventListener("input", (e) => {
  if (e.target.id === "search" || e.target.id === "platformFilter") {
    renderServices();
  }

  if (e.target.id === "quantity") {
    calculatePrice();
  }
});

// ================= INIT =================
loadUser();
loadServices();
