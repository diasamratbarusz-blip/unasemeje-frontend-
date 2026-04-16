const API = "https://your-backend-url.onrender.com/api";

/* ================= LOAD SERVICES ================= */
async function loadServices() {
  try {
    const res = await fetch(API + "/services");

    if (!res.ok) throw new Error("Failed to load services");

    const json = await res.json();

    // ✅ FIX: backend returns { success: true, data: [...] }
    let services = [];

    if (Array.isArray(json)) {
      services = json;
    } else if (json.data && Array.isArray(json.data)) {
      services = json.data;
    } else {
      console.error("Invalid response:", json);
      throw new Error("Invalid services format");
    }

    const list = document.getElementById("services");
    list.innerHTML = "";

    services.forEach(s => {
      const li = document.createElement("li");

      li.innerText = `${s.serviceId || s.service} - ${s.name} (Rate: ${s.rate})`;

      li.onclick = () => {
        document.getElementById("service").value = s.serviceId || s.service;
      };

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load services error:", err);

    document.getElementById("services").innerHTML =
      "<li style='color:red'>Failed to load services</li>";
  }
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  try {
    const service = document.getElementById("service").value;
    const link = document.getElementById("link").value;
    const quantity = document.getElementById("quantity").value;

    const token = localStorage.getItem("token");

    const res = await fetch(API + "/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        serviceId: service,
        link,
        quantity
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ " + (data.error || "Order failed"));
      return;
    }

    alert("✅ Order placed successfully");

    // optional refresh
    loadServices();

  } catch (err) {
    console.error("Order error:", err);
    alert("❌ Network error");
  }
}

/* ================= INIT ================= */
loadServices();
