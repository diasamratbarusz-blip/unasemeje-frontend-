async function loadServices() {
  try {
    const res = await fetch(API_URL + "/services");

    if (!res.ok) {
      throw new Error("Failed to fetch services");
    }

    const json = await res.json();

    // =========================
    // FIX: handle backend format
    // =========================
    let services = [];

    if (Array.isArray(json)) {
      services = json;
    }
    else if (json.data && Array.isArray(json.data)) {
      services = json.data;
    }
    else if (json.data && typeof json.data === "object") {
      // grouped format → flatten it
      Object.values(json.data).forEach(group => {
        if (Array.isArray(group)) {
          services.push(...group);
        } else if (typeof group === "object") {
          Object.values(group).forEach(sub => {
            if (Array.isArray(sub)) {
              services.push(...sub);
            }
          });
        }
      });
    } else {
      throw new Error("Invalid services format");
    }

    allServices = services;
    renderServices(allServices);

  } catch (err) {
    console.error("Services load error:", err);

    // =========================
    // fallback external provider
    // =========================
    try {
      const res2 = await fetch(API_URL + "/services/external");

      const json2 = await res2.json();

      let services2 = [];

      if (Array.isArray(json2)) {
        services2 = json2;
      } else if (json2.data) {
        services2 = json2.data;
      }

      allServices = services2;

      renderServices(allServices);

    } catch (err2) {
      console.error("External services failed:", err2);

      document.getElementById("serviceList").innerHTML =
        "<p style='color:red'>Failed to load services</p>";
    }
  }
}
