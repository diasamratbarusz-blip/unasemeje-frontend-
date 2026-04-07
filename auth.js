// ================= CONFIG =================
const API_URL = "https://your-api-url.com"; // change this

// ================= TOAST =================
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return alert(msg);

  t.innerText = msg;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

// ================= LOADING =================
function showLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "block";
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "none";
}

// ================= TOKEN HELPERS =================
function getToken() {
  return localStorage.getItem("token");
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ================= JWT DECODE (no library) =================
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

// ================= AUTH CHECK =================
function checkAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    logoutUser();
    return;
  }

  const currentTime = Date.now() / 1000;

  if (decoded.exp && decoded.exp < currentTime) {
    logoutUser();
    showToast("Session expired. Please login again.");
  }
}

// Run on dashboard load
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("dashboard")) {
    checkAuth();
    loadUser();
  }
});

// ================= LOAD USER INFO =================
function loadUser() {
  const token = getToken();
  if (!token) return;

  const user = decodeToken(token);
  if (!user) return;

  const el = document.getElementById("userEmail");
  if (el) el.innerText = user.email || "User";
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    return showToast("Fill all fields");
  }

  showLoading();

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (data.token) {
      saveToken(data.token);
      showToast("Login successful");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showToast("Invalid server response");
    }

  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoading();
  }
}

// ================= REGISTER =================
async function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!email || !password || !phone) {
    return showToast("Fill all fields");
  }

  showLoading();

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    showToast("Registered successfully");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (err) {
    showToast(err.message);
  } finally {
    hideLoading();
  }
}

// ================= LOGOUT =================
function logoutUser() {
  removeToken();
  showToast("Logged out");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

// ================= AUTH FETCH HELPER =================
async function authFetch(url, options = {}) {
  const token = getToken();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
    }
