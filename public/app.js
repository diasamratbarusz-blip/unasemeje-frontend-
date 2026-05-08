// ================= CONFIG =================
// Points to your specific Render backend URL
const API = "https://unasemeje-backend-3.onrender.com/api"; 

/* ================= ADMIN SECURITY GATE ================= */
/**
 * Automatically detects if the logged-in user is the owner.
 * Triggers the visibility of the Admin Panel via CSS classes.
 */
function checkAdminAccess(user) {
    const ADMIN_EMAIL = "diasamratbarusz@gmail.com";
    const ADMIN_PHONE = "0715509440";

    const isOwner = user.email === ADMIN_EMAIL || user.phone === ADMIN_PHONE;

    if (isOwner) {
        // Add the class to body to override 'display: none !important' in style.css
        document.body.classList.add('is-admin');
        
        // Manual backup to ensure the element is visible
        const adminBtn = document.getElementById("adminMenu");
        if (adminBtn) adminBtn.style.display = "flex";
        
        console.log("Admin security gate: Owner Verified.");
    }
}

/* ================= USER DATA & SYNC ================= */
async function syncUserProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(API + "/me", {
            headers: { "Authorization": "Bearer " + token }
        });
        const user = await res.json();

        if (res.ok) {
            // Check if this user is the Admin
            checkAdminAccess(user);
            
            // Update UI elements if they exist
            const balanceEl = document.getElementById("userBalance");
            if (balanceEl) balanceEl.innerText = "KES " + (user.balance || 0).toFixed(2);
            
            const nameEl = document.getElementById("userName");
            if (nameEl) nameEl.innerText = user.username || "User";
        }
    } catch (err) {
        console.error("Profile Sync Error:", err);
    }
}

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  const list = document.getElementById("services");
  if (!list) return; 

  try {
    list.innerHTML = "<li style='padding:10px; opacity:0.7;'>Loading services...</li>";

    const res = await fetch(API + "/services");
    if (!res.ok) throw new Error("Failed to load services");

    const json = await res.json();

    let services = [];
    
    // Handling nested response { success: true, data: { Platform: { Category: [] } } }
    if (json.success && json.data) {
      Object.values(json.data).forEach(platform => {
        Object.values(platform).forEach(categoryServices => {
          services = services.concat(categoryServices);
        });
      });
    } else if (Array.isArray(json)) {
      services = json;
    }

    list.innerHTML = "";

    if (services.length === 0) {
      list.innerHTML = "<li style='padding:10px;'>No services available currently.</li>";
      return;
    }

    services.forEach(s => {
      const li = document.createElement("li");
      
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><strong>${s.serviceId}</strong> - ${s.name}</span>
            <span style="color: #10b981; font-weight: bold;">KES ${s.rate}</span>
        </div>
      `;
      
      li.style.cursor = "pointer";
      li.style.padding = "12px";
      li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      li.style.transition = "background 0.2s";

      li.onmouseover = () => li.style.background = "rgba(16, 185, 129, 0.1)";
      li.onmouseout = () => li.style.background = "transparent";

      li.onclick = () => {
        const serviceInput = document.getElementById("service");
        if (serviceInput) {
            serviceInput.value = s.serviceId;
            if (typeof showToast === "function") {
                showToast(`Selected: ${s.name}`);
            }
        }
      };

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load services error:", err);
    if (list) {
        list.innerHTML = "<li style='color:#ef4444; padding:10px;'>⚠️ Connection error.</li>";
    }
  }
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const btn = document.querySelector("button[onclick='placeOrder()']");
  const service = document.getElementById("service")?.value;
  const link = document.getElementById("link")?.value?.trim();
  const quantity = document.getElementById("quantity")?.value;

  if (!service || !link || !quantity) {
    if (typeof showToast === "function") return showToast("Please fill in all fields", "error");
    return alert("Please fill in all fields.");
  }

  const token = localStorage.getItem("token");
  if (!token) return alert("Please login first.");

  try {
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    const res = await fetch(API + "/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        serviceId: String(service), 
        link: link,
        quantity: parseInt(quantity)
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Order failed");

    const successMsg = "✅ Order Success! ID: " + (data.orderId || "OK");
    if (typeof showToast === "function") {
        showToast(successMsg);
    } else {
        alert(successMsg);
    }
    
    if(document.getElementById("link")) document.getElementById("link").value = "";
    if(document.getElementById("quantity")) document.getElementById("quantity").value = "";
    
  } catch (err) {
    console.error("Order error:", err);
    if (typeof showToast === "function") {
        showToast(err.message, "error");
    }
  } finally {
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Confirm Order";
    }
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    // Run security check and sync profile
    syncUserProfile();
    
    // Only run if the services list exists on the current page
    if (document.getElementById("services")) {
        loadServices();
    }
});
