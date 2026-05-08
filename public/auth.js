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
      right: "30px", 
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
    el.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; 
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

/* ================= ADMIN SECURITY GATE ================= */
/**
 * Strictly controls visibility of the Admin Panel based on credentials.
 * Only grants access to diasamratbarusz@gmail.com or 0715509440.
 */
function runAdminSecurityCheck(user) {
    const ADMIN_EMAIL = "diasamratbarusz@gmail.com";
    const ADMIN_PHONE = "0715509440";

    const isOwner = user.email === ADMIN_EMAIL || user.phone === ADMIN_PHONE;

    if (isOwner) {
        // Add class to body to trigger is-admin rules in style.css
        document.body.classList.add('is-admin');
        
        // Manual fallback visibility for the menu
        const adminBtn = document.getElementById("adminMenu");
        if (adminBtn) adminBtn.style.display = "flex";
        
        console.log("Admin security gate: Owner access granted.");
    }
}

// ================= JWT DECODE (Session Management) =================
function decodeToken(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Token decoding failed:", err);
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

  // Run security check for admin elements
  runAdminSecurityCheck(user);

  const now = Date.now() / 1000;
  if (user.exp && user.exp < now) {
    showToast("Session expired, please login again", "error");
    logoutUser();
  }
}

// ================= NAVIGATION HELPERS =================
function redirectLogin() {
  if (!window.location.pathname.includes("index.html") && window.location.pathname !== "/") {
    window.location.href = "index.html";
  }
}

// ================= UI UPDATES =================
function loadUser() {
  const user = decodeToken(getToken());
  if (!user) return;

  const el = document.getElementById("userEmail");
  if (el) el.innerText = user.username || user.email || "User";
}

// ================= LOGIN LOGIC =================
async function login() {
  const identifier = document.getElementById("identifier")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

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
    showToast("Success! Welcome to UNASEMEJE ø DIA.");

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

    showToast("Account created! Redirecting to login...");

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

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers: headers
  });
}

// ================= AUTOMATIC INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  
  const protectedPages = ["dashboard", "order", "profile", "services", "deposit", "admin"];
  const isProtected = protectedPages.some(page => path.includes(page));

  if (isProtected) {
    checkAuth();
    loadUser();
  }
});
