async function loadServices() {
  try {
    const res = await fetch("/api/services");
    const data = await res.json();

    const list = document.getElementById("services");

    list.innerHTML = "";

    data.forEach(service => {
      const li = document.createElement("li");
      li.textContent = `${service.name} - ${service.rate}`;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("❌ Failed to load services", err);
  }
}

loadServices();
