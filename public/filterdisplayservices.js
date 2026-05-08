function filterServices() {
  const category = document.getElementById("category").value.toLowerCase();
  const serviceEl = document.getElementById("service");

  serviceEl.innerHTML = "";

  if (!Array.isArray(allServices)) {
    console.error("allServices is not loaded or invalid");
    serviceEl.innerHTML = `<option value="">No services loaded</option>`;
    return;
  }

  const filtered = allServices.filter(s => {
    const name = (s.name || "").toLowerCase();
    const cat = (s.category || "").toLowerCase();

    if (category === "all") return true;

    // match BOTH category and name for better accuracy
    return cat.includes(category) || name.includes(category);
  });

  if (filtered.length === 0) {
    serviceEl.innerHTML = `<option value="">No services found</option>`;
    return;
  }

  filtered.forEach(s => {
    serviceEl.innerHTML += `
      <option value="${s.serviceId}">
        ${s.name} (Rate: ${s.rate})
      </option>
    `;
  });
}
