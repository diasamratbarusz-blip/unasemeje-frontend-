// ================= CONFIG =================
// Points to your specific Render backend URL (Matches your auth.js)
const API = "https://unasemeje-backend-3.onrender.com/api"; 

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  const list = document.getElementById("services");
  if (!list) return; // Guard clause if element doesn't exist on current page

  try {
    // Show a small loading hint in the list
    list.innerHTML = "<li style='padding:10px; opacity:0.7;'>Loading services...</li>";

    const res = await fetch(API + "/services");

    if (!res.ok) throw new Error("Failed to load services");

    const json = await res.json();

    /**
     * ✅ FIX: Handling nested response { success: true, data: { Platform: { Category: [] } } }
     * Flattening nested object into a single array for the list.
     */
    let services = [];
    
    if (json.success && json.data) {
      Object.values(json.data).forEach(platform => {
        Object.values(platform).forEach(categoryServices => {
          services = services.concat(categoryServices);
        });
      });
    } else if (Array.isArray(json)) {
      services = json;
    } else {
      console.error("Invalid response format:", json);
      throw new Error("Invalid services format");
    }

    // Clear list and populate
    list.innerHTML = "";

    if (services.length === 0) {
      list.innerHTML = "<li style='padding:10px;'>No services available currently.</li>";
      return;
    }

    services.forEach(s => {
      const li = document.createElement("li");
      
      // Formatting list item to match the dashboard aesthetic
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

      // Hover effect
      li.onmouseover = () => li.style.background = "rgba(16, 185, 129, 0.1)";
      li.onmouseout = () => li.style.background = "transparent";

      li.onclick = () => {
        const serviceInput = document.getElementById("service");
        if (serviceInput) {
            serviceInput.value = s.serviceId;
            // If showToast function exists from auth.js, use it, else alert
            if (typeof showToast === "function") {
                showToast(`Selected: ${s.name}`);
            } else {
                alert(`Selected: ${s.name}`);
            }
        }
      };

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load services error:", err);
    if (list) {
        list.innerHTML = "<li style='color:#ef4444; padding:10px;'>⚠️ Failed to load services. Check backend connection.</li>";
    }
  }
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const btn = document.querySelector("button[onclick='placeOrder()']");
  const service = document.getElementById("service")?.value;
  const link = document.getElementById("link")?.value?.trim();
  const quantity = document.getElementById("quantity")?.value;

  // Validation
  if (!service || !link || !quantity) {
    if (typeof showToast === "function") return showToast("Please fill in all fields", "error");
    return alert("❌ Please fill in all fields.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    if (typeof showToast === "function") return showToast("Please login to continue", "error");
    return alert("❌ Please login to place an order.");
  }

  try {
    // UI Loading State
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

    if (!res.ok) {
      throw new Error(data.error || "Order failed");
    }

    // Success Handling
    const successMsg = "✅ Order placed successfully! ID: " + (data.orderId || "Success");
    if (typeof showToast === "function") {
        showToast(successMsg);
    } else {
        alert(successMsg);
    }
    
    // Clear form
    if(document.getElementById("link")) document.getElementById("link").value = "";
    if(document.getElementById("quantity")) document.getElementById("quantity").value = "";
    
  } catch (err) {
    console.error("Order error:", err);
    const errMsg = "❌ " + err.message;
    if (typeof showToast === "function") {
        showToast(errMsg, "error");
    } else {
        alert(errMsg);
    }
  } finally {
    // Restore button state
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Confirm Order";
    }
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    // Only run if the services list exists on the page
    if (document.getElementById("services")) {
        loadServices();
    }
});
