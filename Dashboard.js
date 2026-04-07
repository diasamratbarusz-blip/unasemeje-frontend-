const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

// BALANCE
function loadBalance() {
  fetch(`${API_URL}/balance`, {
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = data.balance || 0;
  });
}

// ORDERS
function loadOrders() {
  fetch(`${API_URL}/orders`, {
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("ordersList");
    list.innerHTML = "";

    document.getElementById("totalOrders").innerText = data.length;

    data.forEach(o => {
      const li = document.createElement("li");
      li.innerText = `${o.service} | ${o.quantity} | ${o.status}`;
      list.appendChild(li);
    });
  });
}

// ORDER
function placeOrder() {
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  fetch(`${API_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ service, link, quantity })
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message || data.error);
    loadOrders();
  });
}

// DEPOSIT (PHONE)
function deposit() {
  const phone = document.getElementById("phone").value;
  const amount = document.getElementById("amount").value;

  fetch(`${API_URL}/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ phone, amount })
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message || data.error);
  });
}

// INIT
loadBalance();
loadOrders();
