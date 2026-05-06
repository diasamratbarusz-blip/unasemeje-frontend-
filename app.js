// Use relative path if hosted on the same domain, otherwise use your Render URL
const API = "/api"; 

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  try {
    const res = await fetch(API + "/services");

    if (!res.ok) throw new Error("Failed to load services");

    const json = await res.json();

    /**
     * ✅ FIX: Your server.js returns { success: true, data: { Platform: { Category: [] } } }
     * We need to flatten this nested object into a single array for the simple list.
     */
    let services = [];
    
    if (json.success && json.data) {
      // Flatten the grouped object from server.js into a single array
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

    const list = document.getElementById("services");
    if (!list) return; // Guard clause if element doesn't exist on current page
    
    list.innerHTML = "";

    services.forEach(s => {
      const li = document.createElement("li");
      
      // Using serviceId and name as defined in your Service model
      li.innerText = `${s.serviceId} - ${s.name} (KES ${s.rate})`;
      li.style.cursor = "pointer";
      li.style.padding = "10px";
      li.style.borderBottom = "1px solid #2d3748";

      li.onclick = () => {
        const serviceInput = document.getElementById("service");
        if (serviceInput) {
            serviceInput.value = s.serviceId;
            // Visual feedback for selection
            alert(`Selected: ${s.name}`);
        }
      };

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load services error:", err);
    const list = document.getElementById("services");
    if (list) {
        list.innerHTML = "<li style='color:red; padding:10px;'>Failed to load services. Please check connection.</li>";
    }
  }
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const btn = document.querySelector("button[onclick='placeOrder()']");
  
  try {
    const service = document.getElementById("service").value;
    const link = document.getElementById("link").value;
    const quantity = document.getElementById("quantity").value;

    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Please login to place an order.");
        return;
    }

    if (!service || !link || !quantity) {
        alert("❌ Please fill in all fields.");
        return;
    }

    // UI Feedback
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Processing...";
    }

    const res = await fetch(API + "/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        serviceId: String(service), // Ensure String for backend match
        link: link,
        quantity: parseInt(quantity) // Ensure Number for backend math
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // Logic from server.js returns errors in data.error
      alert("❌ " + (data.error || "Order failed"));
      if (btn) {
          btn.disabled = false;
          btn.innerText = "Confirm Order";
      }
      return;
    }

    alert("✅ Order placed successfully! ID: " + (data.orderId || "Success"));
    
    // Redirect to orders page or clear form
    document.getElementById("link").value = "";
    document.getElementById("quantity").value = "";
    
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Confirm Order";
    }

  } catch (err) {
    console.error("Order error:", err);
    alert("❌ Network error. Check your backend status.");
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Confirm Order";
    }
  }
}

/* ================= INIT ================= */
// Only run if the services list exists on the page
if (document.getElementById("services")) {
    loadServices();
}
