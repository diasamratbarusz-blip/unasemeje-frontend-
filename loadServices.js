async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    container.innerHTML = "<p>Loading services...</p>";

    try {
        const res = await fetch(API_URL + "/services");

        if (!res.ok) throw new Error("Failed to fetch services");

        const json = await res.json();

        console.log("🔥 RAW SERVICES RESPONSE:", json);

        let services = [];

        /* ================= HANDLE GROUPED RESPONSE ================= */
        if (json?.data && typeof json.data === "object") {
            Object.keys(json.data).forEach(platform => {
                const platformData = json.data[platform];

                Object.keys(platformData).forEach(type => {
                    platformData[type].forEach(s => {
                        services.push({
                            serviceId: String(s.serviceId || s.id || ""),
                            name: cleanText(s.name || "Unnamed Service"),
                            rate: Number(
                                s.sellingRate || s.rate || s.price || 0
                            ),
                            min: Number(s.min || 1),
                            max: Number(s.max || 10000),
                            category: s.category || type,
                            platform: platform
                        });
                    });
                });
            });
        }

        /* ================= HANDLE FLAT RESPONSE ================= */
        else if (Array.isArray(json)) {
            services = json.map(s => ({
                serviceId: String(s.serviceId || s.id || ""),
                name: cleanText(s.name || "Unnamed Service"),
                rate: Number(
                    s.sellingRate || s.rate || s.price || 0
                ),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: detectPlatform(s)
            }));
        }

        if (!services.length) {
            throw new Error("No services found after parsing");
        }

        /* ================= REMOVE INVALID ================= */
        services = services.filter(s =>
            s.serviceId &&
            s.name &&
            !isNaN(s.rate)
        );

        /* ================= REMOVE DUPLICATES ================= */
        services = [
            ...new Map(services.map(s => [s.serviceId, s])).values()
        ];

        /* ================= SAVE ================= */
        allServices = services;

        console.log("✅ CLEAN SERVICES:", allServices);

        /* ================= RENDER ================= */
        renderServices(allServices);

    } catch (err) {
        console.error("❌ MAIN SERVICES ERROR:", err);

        /* ================= FALLBACK ================= */
        try {
            const res2 = await fetch(API_URL + "/services/external");

            if (!res2.ok) throw new Error("External API failed");

            const json2 = await res2.json();

            console.log("🔥 EXTERNAL RESPONSE:", json2);

            let services2 = [];

            if (Array.isArray(json2)) {
                services2 = json2.map(s => ({
                    serviceId: String(s.serviceId || s.id || ""),
                    name: cleanText(s.name || "Unnamed Service"),
                    rate: Number(
                        s.sellingRate || s.rate || s.price || 0
                    ),
                    min: Number(s.min || 1),
                    max: Number(s.max || 10000),
                    category: s.category || "Other",
                    platform: detectPlatform(s)
                }));
            }

            services2 = services2.filter(s => s.serviceId && s.name);

            allServices = services2;

            renderServices(allServices);

        } catch (err2) {
            console.error("❌ FALLBACK FAILED:", err2);

            container.innerHTML = `
                <div style="color:red;">
                    ❌ Failed to load services<br>
                    Check backend /services API
                </div>
            `;
        }
    }
}
