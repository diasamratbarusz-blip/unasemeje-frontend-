<!DOCTYPE html>
<html>
<head>
  <title>SMM Panel Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      font-family: Arial;
      background: #0f172a;
      color: white;
    }

    header {
      padding: 15px;
      background: #111827;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
    }

    .container {
      padding: 15px;
    }

    .row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    input, select {
      padding: 10px;
      border-radius: 8px;
      border: none;
      width: 100%;
      max-width: 300px;
    }

    .card {
      background: #1e293b;
      padding: 15px;
      border-radius: 10px;
      margin-top: 10px;
    }

    .service {
      background: #111827;
      padding: 10px;
      margin-top: 8px;
      border-radius: 8px;
      cursor: pointer;
    }

    .service:hover {
      background: #334155;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
    }

    button {
      padding: 10px;
      border: none;
      border-radius: 8px;
      background: #22c55e;
      color: white;
      cursor: pointer;
      margin-top: 10px;
    }

    button:hover {
      background: #16a34a;
    }
  </style>
</head>

<body>

<header>
  SMM PANEL DASHBOARD
</header>

<div class="container">

  <!-- BALANCE -->
  <div class="card">
    <h3>Balance: <span id="balance">0</span></h3>
  </div>

  <!-- FILTERS -->
  <div class="row">
    <input id="search" placeholder="Search services..." onkeyup="renderServices()">

    <select id="platformFilter" onchange="renderServices()">
      <option value="all">All Platforms</option>
      <option value="Instagram">Instagram</option>
      <option value="TikTok">TikTok</option>
      <option value="Facebook">Facebook</option>
      <option value="YouTube">YouTube</option>
      <option value="Twitter/X">Twitter/X</option>
    </select>
  </div>

  <!-- SERVICES -->
  <div class="card">
    <h3>Services</h3>
    <div id="services" class="grid"></div>
  </div>

  <!-- ORDER -->
  <div class="card">
    <h3>Place Order</h3>

    <input id="serviceId" placeholder="Service ID" readonly>
    <input id="link" placeholder="Target Link">
    <input id="quantity" placeholder="Quantity" type="number" oninput="calcPrice()">

    <p>Total Price: <b id="total">0</b></p>

    <button onclick="placeOrder()">Place Order</button>
  </div>

</div>

<script>
const API = "";
const token = localStorage.getItem("token");

if (!token) window.location.href = "index.html";

let servicesData = [];
let selectedRate = 0;

/* ================= LOAD BALANCE ================= */
async function loadBalance() {
  try {
    const res = await fetch("/api/me", {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    document.getElementById("balance").innerText = data.balance || 0;
  } catch (err) {
    console.error(err);
  }
}

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  try {
    const res = await fetch("/api/services");
    const json = await res.json();

    servicesData = json.data || [];
    renderServices();

  } catch (err) {
    console.error("Services load error", err);
    alert("Failed to load services");
  }
}

/* ================= RENDER SERVICES ================= */
function renderServices() {
  const container = document.getElementById("services");
  container.innerHTML = "";

  const search = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("platformFilter").value;

  servicesData.forEach(s => {

    const platform = detectPlatform(s.category || "");

    if (filter !== "all" && platform !== filter) return;
    if (!s.name.toLowerCase().includes(search)) return;

    const div = document.createElement("div");
    div.className = "service";

    div.innerHTML = `
      <b>${s.name}</b><br>
      ID: ${s.serviceId}<br>
      Price: ${s.rate}
    `;

    div.onclick = () => selectService(s);

    container.appendChild(div);
  });
}

/* ================= PLATFORM DETECT ================= */
function detectPlatform(cat) {
  cat = cat.toLowerCase();

  if (cat.includes("instagram")) return "Instagram";
  if (cat.includes("tiktok")) return "TikTok";
  if (cat.includes("facebook")) return "Facebook";
  if (cat.includes("youtube")) return "YouTube";
  if (cat.includes("twitter") || cat.includes("x")) return "Twitter/X";

  return "Other";
}

/* ================= SELECT SERVICE ================= */
function selectService(service) {
  document.getElementById("serviceId").value = service.serviceId;
  selectedRate = Number(service.rate || 0);
  calcPrice();
}

/* ================= PRICE CALC ================= */
function calcPrice() {
  const qty = Number(document.getElementById("quantity").value || 0);
  const total = (selectedRate / 1000) * qty;

  document.getElementById("total").innerText = total.toFixed(2);
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const serviceId = document.getElementById("serviceId").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  if (!serviceId || !link || !quantity) {
    alert("Fill all fields");
    return;
  }

  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ serviceId, link, quantity })
  });

  const json = await res.json();

  alert(json.message || json.error || "Done");
  loadBalance();
}

/* ================= INIT ================= */
loadBalance();
loadServices();
</script>

</body>
</html>
