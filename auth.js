// ================= CONFIG =================
// Points to your specific Render backend URL
const API_URL = "https://unasemeje-backend-3.onrender.com/api";

// ================= TOAST NOTIFICATIONS =================
function showToast(msg, type = "success") {
  let t = document.getElementById("toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);

    // Styling matches the unasemeje ø dia aesthetic
    Object.assign(t.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 18px",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "bold",
      zIndex: "9999",
      display: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    });
  }

  t.innerText = msg;
  // Green for success, Red for error
  t.style.background = type === "error" ? "#ef4444" : "#22c55e";
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

// ================= LOADING STATES =================
function showLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "block";
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "none";
}

// ================= TOKEN MANAGEMENT =================
function getToken() {
  return localStorage.getItem("token");
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ================= JWT DECODE (Session Management) =================
function decodeToken(token) {
  try {
    if (!token) return null;
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch (err) {
    return null;
  }
}

// ================= AUTHENTICATION CHECK =================
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

  // Session expiry check
  if (user.exp && user.exp < now) {
    logoutUser();
    showToast("Session expired, please login again", "error");
  }
}

// ================= NAVIGATION HELPERS =================
function redirectLogin() {
  window.location.href = "index.html";
}

// ================= UI UPDATES =================
function loadUser() {
  const user = decodeToken(getToken());
  if (!user) return;

  // Displays the user's email in the dashboard sidebar or header
  const el = document.getElementById("userEmail");
  if (el) el.innerText = user.email || "User";
}

// ================= LOGIN LOGIC =================
async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  // Validates presence of credentials
  if (!email || !password) {
    return showToast("Please enter both email and password", "error");
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
      throw new Error(data.error || "Invalid login credentials");
    }

    saveToken(data.token);
    showToast("Login successful! Welcome back.");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoading();
  }
}

// ================= REGISTRATION LOGIC =================
async function register() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();
  // Optional referral code for the referral bonus feature
  const referralCode = document.getElementById("referralCode")?.value?.trim();

  // Mandatory fields for Unasemeje SMM registration
  if (!email || !password || !phone) {
    return showToast("Email, Password, and Phone are required", "error");
  }

  showLoading();

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        password, 
        phone,
        referralCode: referralCode || null 
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    showToast("Account created successfully! Please login.");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoading();
  }
}

// ================= LOGOUT LOGIC =================
function logoutUser() {
  removeToken();
  showToast("Successfully logged out");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

// ================= AUTHORIZED FETCH WRAPPER =================
// Use this for any dashboard calls that require the JWT token
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

// ================= AUTOMATIC INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  // Only runs authentication checks if the user is on the dashboard
  if (window.location.pathname.includes("dashboard")) {
    checkAuth();
    loadUser();
  }
});
