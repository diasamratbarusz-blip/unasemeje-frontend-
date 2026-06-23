// ==========================================
// 1. DYNAMICALLY POPULATE CATEGORIES 
// (Ensures categories are named exactly as the provider named them)
// ==========================================
function populateCategories() {
  const categorySelect = document.getElementById("category");
  if (!categorySelect || !Array.isArray(allServices)) return;

  // Extract unique categories exactly as named by the provider
  const uniqueCategories = [...new Set(allServices.map(s => s.category).filter(cat => cat && cat.trim() !== ""))];
  
  // Reset dropdown and add "All" option
  categorySelect.innerHTML = `<option value="all">-- All Categories --</option>`;
  
  // Sort categories alphabetically for easy navigation
  uniqueCategories.sort((a, b) => a.localeCompare(b));
  
  // Append exact category names from the provider
  uniqueCategories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

// ==========================================
// 2. UPDATED FILTER FUNCTION
// (Uses exact matching to preserve provider's accurate naming)
// ==========================================
function filterServices() {
  const categorySelect = document.getElementById("category");
  const serviceEl = document.getElementById("service");
  
  if (!categorySelect || !serviceEl) {
    console.error("Dropdown elements not found.");
    return;
  }

  const selectedCategory = categorySelect.value;
  serviceEl.innerHTML = "";

  if (!Array.isArray(allServices) || allServices.length === 0) {
    console.error("allServices is not loaded or invalid");
    serviceEl.innerHTML = `<option value="">No services loaded</option>`;
    return;
  }

  let filtered = [];

  if (selectedCategory.toLowerCase() === "all" || selectedCategory === "") {
    // Show ALL services if "All" is selected
    filtered = allServices;
  } else {
    // EXACT MATCH: Only show services where the category exactly matches the provider's name.
    // This prevents ".includes()" from accidentally grouping unrelated services.
    filtered = allServices.filter(s => s.category === selectedCategory);
  }

  if (filtered.length === 0) {
    serviceEl.innerHTML = `<option value="">No services found in this category</option>`;
    return;
  }

  // Sort services alphabetically by name for better UX
  filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Render options using the EXACT name from the provider
  filtered.forEach(s => {
    const exactName = s.name || "Unnamed Service";
    const rate = s.rate !== undefined ? s.rate : "N/A";
    
    // We do not alter s.name here to ensure 100% accuracy to the provider's naming
    serviceEl.innerHTML += `<option value="${s.serviceId}">${exactName} (Rate: ${rate})</option>`;
  });
}

// ==========================================
// HOW TO USE:
// Call populateCategories() right after you fetch allServices from your API.
// Example:
/*
async function loadServices() {
  const res = await fetch('YOUR_API_URL/services');
  allServices = await res.json();
  
  populateCategories(); // Populates the category dropdown with exact provider names
  filterServices();     // Populates the service dropdown (defaults to "All")
}
*/
