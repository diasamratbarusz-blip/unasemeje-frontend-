const API = "https://your-backend-url.onrender.com/api"; 
// 🔥 change this to your live backend

// ================= LOAD SERVICES =================
async function loadServices() {
  try {
    const res = await fetch(API + "/services");

    if (!res.ok) throw new Error("Failed to load services");

    const data = await res.json();

    const list = document.getElementById("services");

    list.innerHTML = ""; // 🔥 prevent duplicates

    data.forEach(s => {
      const li = document.createElement("li");

      li.innerText = `${s.serviceId || s.service} - ${s.name} (Rate: ${s.rate})`;

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load services error:", err);

    document.getElementById("services").innerHTML =
      "<li style='color:red'>Failed to load services</li>";
  }
}

// ================= PLACE ORDER =================
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
      body: JSON.stringify({ serviceId: service, link, quantity })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ " + (data.error || "Order failed"));
      return;
    }

    alert("✅ Order placed successfully");

  } catch (err) {
    console.error("Order error:", err);
    alert("❌ Network error");
  }
}

// ================= INIT =================
loadServices();
