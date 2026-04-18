// ================= CONFIG =================
const API_URL = "https://unasemeje-backend-3.onrender.com/api";

// ================= TOAST =================
function showToast(msg, type = "success") {
  let t = document.getElementById("toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);

    Object.assign(t.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 18px",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "14px",
      zIndex: "9999",
      display: "none"
    });
  }

  t.innerText = msg;
  t.style.background = type === "error" ? "#ef4444" : "#22c55e";
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

// ================= JWT DECODE =================
function decodeToken(token) {
  try {
    if (!token) return null;
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch (err) {
    return null;
  }
}

// ================= CHECK AUTH =================
function checkAuth() {
  const token = getToken();
  if (!token) {
    redirectLogin();
    return;
  }

  const user = decodeToken(token);
  if (!user) {
    logoutUser();
    return;
  }

  const now = Date.now() / 1000;

  // expired token check
  if (user.exp && user.exp < now) {
    logoutUser();
    showToast("Session expired", "error");
  }
}

// ================= REDIRECT =================
function redirectLogin() {
  window.location.href = "index.html";
}

// ================= LOAD USER =================
function loadUser() {
  const user = decodeToken(getToken());
  if (!user) return;

  const el = document.getElementById("userEmail");
  if (el) el.innerText = user.email || "User";
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  if (!email || !password) {
    return showToast("Fill all fields", "error");
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

    saveToken(data.token);

    showToast("Login successful");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoading();
  }
}

// ================= REGISTER =================
async function register() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();

  if (!email || !password || !phone) {
    return showToast("Fill all fields", "error");
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

    showToast("Account created successfully");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);

  } catch (err) {
    showToast(err.message, "error");
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

// ================= AUTH FETCH WRAPPER =================
async function authFetch(url, options = {}) {
  const token = getToken();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ""
    }
  });
}

// ================= AUTO INIT =================
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("dashboard")) {
    checkAuth();
    loadUser();
  }
});
