function filterServices(){
  const category = document.getElementById("category").value;
  const serviceEl = document.getElementById("service");

  serviceEl.innerHTML = "";

  const filtered = allServices.filter(s =>
    s.name.toLowerCase().includes(category)
  );

  filtered.forEach(s=>{
    serviceEl.innerHTML += `
      <option value="${s.service}">
        ${s.name} (Rate: ${s.rate})
      </option>
    `;
  });
}
