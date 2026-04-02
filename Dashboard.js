const API_URL = "https://unasemeje.onrender.com";
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!token) {
  window.location.href = "index.html";
}

// Load balance
function loadBalance() {
  fetch(`${API_URL}/balance`, {
    headers: {
      Authorization: token
    }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = data.balance;
  })
  .catch(err => console.log(err));
}

// Place order
function placeOrder() {
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  fetch(`${API_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ service, link, quantity })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// Auto load balance
loadBalance();
