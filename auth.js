function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return alert(msg);

  t.innerText = msg;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

// LOGIN
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    return showToast("Fill all fields");
  }

  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      showToast("Login successful");
      setTimeout(() => window.location.href = "dashboard.html", 1000);
    } else {
      showToast(data.error || "Login failed");
    }
  })
  .catch(() => showToast("Server error"));
}

// REGISTER
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!email || !password || !phone) {
    return showToast("Fill all fields");
  }

  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password, phone })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      showToast("Registered successfully");
      setTimeout(() => window.location.href = "index.html", 1000);
    } else {
      showToast(data.error || "Registration failed");
    }
  })
  .catch(() => showToast("Server error"));
}

// LOGOUT
function logoutUser() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
