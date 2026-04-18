async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    container.innerHTML = "<p>Loading services...</p>";

    try {
        const res = await fetch(API_URL + "/services");

        if (!res.ok) {
            throw new Error("Failed to fetch services");
        }

        const json = await res.json();

        console.log("MAIN SERVICES RESPONSE:", json);

        let services = [];

        // =========================
        // CASE 1: direct array
        // =========================
        if (Array.isArray(json)) {
            services = json;
        }

        // =========================
        // CASE 2: { data: [] }
        // =========================
        else if (json.data && Array.isArray(json.data)) {
            services = json.data;
        }

        // =========================
        // CASE 3: grouped format { data: { Instagram: [], TikTok: [] } }
        // =========================
        else if (json.data && typeof json.data === "object") {
            Object.values(json.data).forEach(group => {
                if (Array.isArray(group)) {
                    services.push(...group);
                }
            });
        }

        // =========================
        // INVALID FORMAT
        // =========================
        else {
            throw new Error("Invalid services format");
        }

        // =========================
        // SAVE GLOBAL
        // =========================
        allServices = services;

        renderServices(allServices);

    } catch (err) {
        console.error("Main services error:", err);

        // =========================
        // FALLBACK: external provider
        // =========================
        try {
            const res2 = await fetch(API_URL + "/services/external");

            if (!res2.ok) throw new Error("External failed");

            const json2 = await res2.json();

            console.log("EXTERNAL SERVICES RESPONSE:", json2);

            let services2 = [];

            if (Array.isArray(json2)) {
                services2 = json2;
            }
            else if (json2.data && Array.isArray(json2.data)) {
                services2 = json2.data;
            }
            else if (json2.data && typeof json2.data === "object") {
                Object.values(json2.data).forEach(group => {
                    if (Array.isArray(group)) {
                        services2.push(...group);
                    }
                });
            }

            allServices = services2;
            renderServices(allServices);

        } catch (err2) {
            console.error("External services failed:", err2);

            container.innerHTML =
                "<p style='color:red'>Failed to load services</p>";
        }
    }
}
