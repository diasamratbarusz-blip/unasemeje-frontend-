const supabase = supabase.createClient(
  "https://hudcypsorcmarkknamre.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZGN5cHNvcmNtYXJra25hbXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODkxMzYsImV4cCI6MjA5MTA2NTEzNn0.5S3gs7u5JI6nbh8y13VK0b4E-rxCBFdaDj1dlExVLT0"
);

const API_URL = "https://unasemeje.onrender.com";

// Check login
async function checkUser() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    window.location.href = "index.html";
  }
}

checkUser();

// Load balance
function loadBalance() {
  const token = localStorage.getItem("token");

  fetch(`${API_URL}/balance`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = data.balance;
  });
}

// Place order
function placeOrder() {
  const token = localStorage.getItem("token");

  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  fetch(`${API_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ service, link, quantity })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadOrders();
  });
}

// Load orders
function loadOrders() {
  const token = localStorage.getItem("token");

  fetch(`${API_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("orders");
    list.innerHTML = "";

    data.forEach(order => {
      const li = document.createElement("li");
      li.innerText = `${order.service} | ${order.quantity} | ${order.status}`;
      list.appendChild(li);
    });
  });
}

// Deposit
function deposit() {
  const token = localStorage.getItem("token");

  const amount = document.getElementById("amount").value;
  const code = document.getElementById("code").value;

  fetch(`${API_URL}/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount, code })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// Auto load
loadBalance();
