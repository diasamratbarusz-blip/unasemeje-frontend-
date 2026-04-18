async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    container.innerHTML = "<p>Loading services...</p>";

    try {
        const res = await fetch(API_URL + "/services");

        if (!res.ok) throw new Error("Failed to fetch services");

        const json = await res.json();

        console.log("MAIN SERVICES RESPONSE:", json);

        let services = extractServices(json);

        if (!services.length) throw new Error("Empty services");

        // ================= CLEAN + NORMALIZE =================
        services = services
            .filter(s => s && s.serviceId || s.id || s.name)
            .map(s => ({
                serviceId: String(s.serviceId || s.id || ""),
                name: cleanText(s.name || "Service"),
                rate: Number(s.rate || s.price || 0),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: detectPlatform(s),
            }));

        // remove duplicates
        services = [...new Map(services.map(s => [s.serviceId, s])).values()];

        allServices = services;

        renderServices(allServices);

    } catch (err) {
        console.error("Main services error:", err);

        // ================= FALLBACK =================
        try {
            const res2 = await fetch(API_URL + "/services/external");

            if (!res2.ok) throw new Error("External failed");

            const json2 = await res2.json();

            console.log("EXTERNAL SERVICES RESPONSE:", json2);

            let services2 = extractServices(json2);

            services2 = services2
                .filter(s => s)
                .map(s => ({
                    serviceId: String(s.serviceId || s.id || ""),
                    name: cleanText(s.name || "Service"),
                    rate: Number(s.rate || s.price || 0),
                    min: Number(s.min || 1),
                    max: Number(s.max || 10000),
                    category: s.category || "Other",
                    platform: detectPlatform(s),
                }));

            allServices = services2;

            renderServices(allServices);

        } catch (err2) {
            console.error("External services failed:", err2);

            container.innerHTML =
                "<p style='color:red'>Failed to load services</p>";
        }
    }
}
