// ================= CONFIG =================
// Single-API Configuration pointing to your Vercel production deployment
const API_URLS = [
    "https://unasemeje-backend.vercel.app/api"      // Primary Production Instance
];

// Kept for backward compatibility with other files that might use API_URL directly
const API_URL = API_URLS[0]; 

// Smart Fetch Wrapper for unauthenticated requests (Login/Register)
async function apiRequest(path, options = {}) {
    const currentUrl = API_URLS[0] + path;
    try {
        const response = await fetch(currentUrl, options);
        
        // Return the response immediately if reachable (including 4xx/5xx for handling)
        return response;
    } catch (error) {
        // Network error (offline, DNS failure, CORS, timeout)
        console.error(`Connection failed for ${API_URLS[0]}.`, error);
        throw new Error("The backend server is currently unreachable. Please check your network.");
    }
}

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
 * Only grants access to the specified administrator account.
 */
function runAdminSecurityCheck(user) {
    // UPDATED: Matches the ADMIN_EMAIL in server.js
    const ADMIN_EMAIL = "diasamratb@gmail.com";
    const ADMIN_PHONE = "0715509440";

    const isOwner = (user.email && user.email.toLowerCase() === ADMIN_EMAIL) || user.phone === ADMIN_PHONE;

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
/**
 * Checks authentication locally by decoding the JWT.
 * Because this does NOT make a network request, it will NEVER 
 * accidentally log a user out due to a server timeout or 500 error.
 */
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
  // Ensure we don't loop on the index page
  const path = window.location.pathname;
  if (!path.includes("index.html") && path !== "/" && path !== "") {
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
    // Uses the smart apiRequest wrapper
    const res = await apiRequest('/login', {
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
  const confirm_password = document.getElementById("confirm_password")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();
  const referralCode = document.getElementById("referralCode")?.value?.trim();

  // Optional Payment Profile Fields
  const firstName = document.getElementById("firstName")?.value?.trim();
  const lastName = document.getElementById("lastName")?.value?.trim();
  const paymentPhone1 = document.getElementById("paymentPhone1")?.value?.trim();
  const paymentPhone2 = document.getElementById("paymentPhone2")?.value?.trim();
  const country = document.getElementById("country")?.value;

  // ==========================================
  // FIELD REQUIREMENTS VALIDATION
  // COMPULSORY: email, phone, password, confirm_password
  // OPTIONAL: username, firstName, lastName, paymentPhone1, paymentPhone2, country
  // ==========================================
  if (!email || !phone || !password || !confirm_password) {
    return showToast("Please fill in all required fields (Email, Phone, Password)", "error");
  }

  if (password !== confirm_password) {
    return showToast("Passwords do not match!", "error");
  }

  showLoading();

  try {
    // Uses the smart apiRequest wrapper
    const res = await apiRequest('/register', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: username || null,
        email, 
        password, 
        phone,
        firstName: firstName || null,
        lastName: lastName || null,
        paymentPhone1: paymentPhone1 || null,
        paymentPhone2: paymentPhone2 || null,
        country: country || null,
        referralCode: referralCode || null 
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed. Check details.");
    }

    showToast("Account & Payment Profile created! Redirecting to login...");

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
/**
 * Global wrapper for all API calls that require authentication.
 * Automatically injects the Bearer token and handles basic JSON headers.
 */
async function authFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
      // Execute the request directly targeting your deployment
      const res = await fetch(url, { ...options, headers });
      return res;
  } catch (error) {
      console.error(`Auth fetch connection exception encountered at: ${url}`, error);
      throw error;
  }
}

// ================= AUTOMATIC INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  
  // List of keywords that trigger an authentication check
  const protectedPages = ["dashboard", "order", "profile", "services", "deposit", "admin", "funds", "referrals"];
  const isProtected = protectedPages.some(page => path.includes(page));

  if (isProtected) {
    checkAuth();
    loadUser();
  }
});
