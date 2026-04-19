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

        /* ================= HANDLE GROUPED FORMAT ================= */
        if (json?.data && typeof json.data === "object") {

            Object.keys(json.data).forEach(platform => {
                const categories = json.data[platform];

                Object.keys(categories).forEach(type => {
                    categories[type].forEach(s => {
                        services.push({
                            serviceId: String(s.serviceId || ""),
                            name: cleanText(s.name || "Unnamed Service"),

                            // ✅ USE SELLING PRICE (IMPORTANT)
                            rate: Number(s.sellingRate || s.rate || 0),

                            min: Number(s.min || 1),
                            max: Number(s.max || 10000),
                            category: s.category || type,
                            platform: platform
                        });
                    });
                });
            });

        } else {
            /* ================= FALLBACK (FLAT FORMAT) ================= */
            let rawServices = extractServices(json);

            if (!Array.isArray(rawServices) || rawServices.length === 0) {
                throw new Error("No services found in response");
            }

            services = rawServices.map(s => ({
                serviceId: String(s.serviceId || s.id || s.service || ""),
                name: cleanText(s.name || "Unnamed Service"),
                rate: Number(s.sellingRate || s.rate || s.price || 0),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: detectPlatform(s)
            }));
        }

        /* ================= CLEAN ================= */
        services = services.filter(s =>
            s.serviceId &&
            s.name &&
            !isNaN(s.rate)
        );

        /* ================= REMOVE DUPLICATES ================= */
        services = [...new Map(
            services.map(s => [s.serviceId, s])
        ).values()];

        /* ================= SAVE ================= */
        allServices = services;

        console.log("✅ CLEAN SERVICES:", allServices);

        if (!allServices.length) {
            container.innerHTML = "<p style='color:red'>No services available</p>";
            return;
        }

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

            let rawServices = extractServices(json2);

            let services2 = rawServices.map(s => ({
                serviceId: String(s.serviceId || s.id || s.service || ""),
                name: cleanText(s.name || "Unnamed Service"),
                rate: Number(s.sellingRate || s.rate || s.price || 0),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: detectPlatform(s)
            }));

            services2 = services2.filter(s => s.serviceId && s.name);

            allServices = services2;

            if (!allServices.length) {
                container.innerHTML = "<p style='color:red'>No fallback services</p>";
                return;
            }

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
