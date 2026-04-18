const API = "https://unasemeje-backend-3.onrender.com/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

/* ================= STATE ================= */
let servicesData = [];
let selectedService = null;

/* ================= HEADERS ================= */
function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token
  };
}

/* ================= LOAD USER ================= */
async function loadUser() {
  try {
    const res = await fetch(API + "/me", { headers: headers() });
    const data = await res.json();

    if (!res.ok) throw new Error("User load failed");

    const balanceEl = document.getElementById("balance");
    if (balanceEl) {
      balanceEl.innerText = Number(data.balance || 0).toFixed(2);
    }

  } catch (err) {
    console.error("User load error:", err);
  }
}

/* ================= NORMALIZE SERVICES ================= */
function normalizeServices(json) {
  let services = [];

  if (Array.isArray(json)) {
    services = json;
  }
  else if (json?.data && Array.isArray(json.data)) {
    services = json.data;
  }
  else if (json?.data && typeof json.data === "object") {
    Object.entries(json.data).forEach(([platform, group]) => {
      if (Array.isArray(group)) {
        group.forEach(s => {
          services.push({
            ...s,
            platform
          });
        });
      }
    });
  }

  return services;
}

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  try {
    const res = await fetch(API + "/services");
    const json = await res.json();

    if (!res.ok) throw new Error("Services fetch failed");

    servicesData = normalizeServices(json);

    renderServices();

  } catch (err) {
    console.error("Services error:", err);
  }
}

/* ================= RENDER SERVICES ================= */
function renderServices() {
  const container = document.getElementById("services");
  if (!container) return;

  const search = document.getElementById("search")?.value?.toLowerCase() || "";
  const filter = document.getElementById("platformFilter")?.value || "all";

  container.innerHTML = "";

  servicesData.forEach(s => {

    if (filter !== "all" && s.platform !== filter) return;
    if (search && !String(s.name).toLowerCase().includes(search)) return;

    const div = document.createElement("div");
    div.className = "service";

    div.innerHTML = `
      <b>${s.name}</b><br>
      <small>Platform: ${s.platform || "Other"}</small><br>
      <small>ID: ${s.serviceId}</small><br>
      <span style="color:#22c55e;font-weight:bold">
        KSH ${Number(s.rate).toFixed(2)}
      </span>
    `;

    div.onclick = () => selectService(s);

    container.appendChild(div);
  });
}

/* ================= SELECT SERVICE ================= */
function selectService(service) {
  selectedService = service;

  const idInput = document.getElementById("serviceId");
  if (idInput) idInput.value = service.serviceId;

  document.querySelector(".order-box")?.scrollIntoView({
    behavior: "smooth"
  });

  calculatePrice();
}

/* ================= PRICE CALC ================= */
function calculatePrice() {
  if (!selectedService) return;

  const qty = Number(document.getElementById("quantity")?.value || 0);

  const price = (Number(selectedService.rate) / 1000) * qty;

  const totalEl = document.getElementById("total");
  if (totalEl) {
    totalEl.innerText = price.toFixed(2) + " KSH";
  }
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const serviceId = document.getElementById("serviceId")?.value;
  const link = document.getElementById("link")?.value;
  const quantity = document.getElementById("quantity")?.value;

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

    if (!res.ok) throw new Error(data.error || "Order failed");

    alert("Order placed successfully ✅");

    loadUser();

    // reset fields
    document.getElementById("link").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("total").innerText = "0";

  } catch (err) {
    alert(err.message);
  }
}

/* ================= LIVE INPUT EVENTS ================= */
document.addEventListener("input", (e) => {

  if (e.target.id === "search" || e.target.id === "platformFilter") {
    renderServices();
  }

  if (e.target.id === "quantity") {
    calculatePrice();
  }
});

/* ================= INIT ================= */
window.onload = () => {
  loadUser();
  loadServices();
};
