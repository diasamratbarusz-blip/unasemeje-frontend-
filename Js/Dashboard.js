// Redirect if not logged in
if (!getToken()) {
  window.location.href = "index.html";
}

// LOAD BALANCE
async function loadBalance() {
  const res = await fetch(`${API_URL}/balance`, {
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
}

// PLACE ORDER
async function placeOrder() {
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  const res = await fetch(`${API_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ service, link, quantity })
  });

  const data = await res.json();
  alert(data.message);
  loadOrders();
}

// LOAD ORDERS
async function loadOrders() {
  const res = await fetch(`${API_URL}/orders`, {
    headers: {
      Authorization: "Bearer " + getToken()
    }
  });

  const data = await res.json();
  const list = document.getElementById("orders");

  list.innerHTML = "";

  data.forEach(order => {
    const li = document.createElement("li");
    li.innerText = `${order.service} | ${order.quantity} | ${order.status}`;
    list.appendChild(li);
  });
}

// DEPOSIT (M-PESA)
async function deposit() {
  const phone = document.getElementById("phone").value;
  const amount = document.getElementById("amount").value;

  const res = await fetch(`${API_URL}/mpesa/stk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify({ phone, amount })
  });

  const data = await res.json();
  alert(data.message);
}

// LOGOUT
function logoutUser() {
  logout();
}

// INIT
loadBalance();
loadOrders();
