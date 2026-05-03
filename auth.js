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

    // Styling updated to match the Neon Emerald & Deep Navy aesthetic
    Object.assign(t.style, {
      position: "fixed",
      bottom: "30px",
      right: "30px", // Moved to side for modern look
      padding: "16px 24px",
      borderRadius: "14px",
      color: "#fff",
      fontSize: "14px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: "700",
      zIndex: "9999",
      display: "none",
      boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.1)",
      transition: "all 0.3s ease"
    });
  }

  t.innerText = msg;
  // Neon Emerald for success (#10b981), Soft Red for error (#ef4444)
  t.style.background = type === "error" ? "#ef4444" : "#10b981";
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 4000);
}

// ================= LOADING STATES =================
function showLoading() {
  const el = document.getElementById("loading");
  if (el) {
    el.style.display = "flex";
    el.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; // Adds visual spinner
  }
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

  // Displays the user's username (or email if username is missing) in the dashboard
  const el = document.getElementById("userEmail");
  if (el) el.innerText = user.username || user.email || "User";
}

// ================= LOGIN LOGIC =================
async function login() {
  // FIXED: Updated IDs to match identifier/password in your modern index.html
  const identifier = document.getElementById("identifier")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  // If you are using 'email' as the ID in your HTML, change 'identifier' above back to 'email'
  if (!identifier || !password) {
    return showToast("Please enter your username/email and password", "error");
  }

  showLoading();

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Invalid login credentials");
    }

    saveToken(data.token);
    showToast("Success! Welcome to UNASEMEJE SMM.");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoading();
  }
}

// ================= REGISTRATION LOGIC =================
async function register() {
  const username = document.getElementById("username")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();
  const referralCode = document.getElementById("referralCode")?.value?.trim();

  // Full validation for Kenyan market users
  if (!username || !email || !password || !phone) {
    return showToast("Username, Email, Password, and Phone are required", "error");
  }

  showLoading();

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username,
        email, 
        password, 
        phone,
        referralCode: referralCode || null 
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed. Check details.");
    }

    showToast("Account verified! Redirecting to login...");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoading();
  }
}

// ================= LOGOUT LOGIC =================
function logoutUser() {
  removeToken();
  showToast("Safe Logout successful", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

// ================= AUTHORIZED FETCH WRAPPER =================
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
  // Check for dashboard or internal pages
  if (window.location.pathname.includes("dashboard") || window.location.pathname.includes("order")) {
    checkAuth();
    loadUser();
  }
});
