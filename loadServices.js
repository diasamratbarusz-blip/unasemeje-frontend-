async function loadServices(){
  try {
    const res = await fetch(API_URL + "/services");

    if (!res.ok) {
      throw new Error("Failed to fetch services");
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid services format");
    }

    allServices = data;

    renderServices(allServices);

  } catch(err){
    console.error("Services load error:", err);

    // 🔥 fallback to external provider
    try {
      const res2 = await fetch(API_URL + "/services/external");
      const data2 = await res2.json();

      allServices = Array.isArray(data2) ? data2 : [];

      renderServices(allServices);

    } catch (err2) {
      console.error("External services failed:", err2);

      document.getElementById("serviceList").innerHTML =
        "<p style='color:red'>Failed to load services</p>";
    }
  }
}
