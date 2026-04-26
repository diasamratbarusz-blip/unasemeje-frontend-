/**
 * =========================================
 * LOAD SERVICES
 * =========================================
 * Fetches and parses services from the backend.
 * Handles both grouped (by platform/type) and flat responses.
 */
async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    container.innerHTML = `
        <div class="loading-spinner">
            <p>🔄 Syncing latest services from African markets...</p>
        </div>
    `;

    try {
        // Fetch from your primary local services route
        const res = await fetch(API_URL + "/services");

        if (!res.ok) throw new Error("Failed to fetch services");

        const json = await res.json();

        console.log("🔥 RAW SERVICES RESPONSE:", json);

        let services = [];

        /* ================= HANDLE GROUPED RESPONSE ================= */
        // This handles the platform -> type -> service hierarchy
        if (json?.success && json.data && typeof json.data === "object" && !Array.isArray(json.data)) {
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
                            platform: platform,
                            provider: s.provider || "PROVIDER1" // Tracking the origin provider
                        });
                    });
                });
            });
        }

        /* ================= HANDLE FLAT RESPONSE ================= */
        else if (Array.isArray(json) || (json?.success && Array.isArray(json.data))) {
            const list = Array.isArray(json) ? json : json.data;
            services = list.map(s => ({
                serviceId: String(s.serviceId || s.id || ""),
                name: cleanText(s.name || "Unnamed Service"),
                rate: Number(
                    s.sellingRate || s.rate || s.price || 0
                ),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: s.platform || detectPlatform(s),
                provider: s.provider || "PROVIDER1"
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
        // Note: We duplicate-check based on ID + Provider to avoid removing 
        // similar IDs from different companies.
        services = [
            ...new Map(services.map(s => [`${s.provider}_${s.serviceId}`, s])).values()
        ];

        /* ================= SAVE GLOBALLY ================= */
        allServices = services;

        console.log("✅ CLEAN SERVICES LOADED:", allServices.length);

        /* ================= RENDER ================= */
        renderServices(allServices);

    } catch (err) {
        console.error("❌ MAIN SERVICES ERROR:", err);

        /* ================= FALLBACK ================= */
        // This checks your alternative external-services route if the main one fails
        try {
            const res2 = await fetch(API_URL + "/external-services");

            if (!res2.ok) throw new Error("External API route failed");

            const json2 = await res2.json();

            console.log("🔥 EXTERNAL/BACKUP RESPONSE:", json2);

            let services2 = [];
            const list2 = json2.data || json2;

            if (Array.isArray(list2)) {
                services2 = list2.map(s => ({
                    serviceId: String(s.serviceId || s.id || ""),
                    name: cleanText(s.name || "Unnamed Service"),
                    rate: Number(
                        s.sellingRate || s.rate || s.price || 0
                    ),
                    min: Number(s.min || 1),
                    max: Number(s.max || 10000),
                    category: s.category || "Other",
                    platform: detectPlatform(s),
                    provider: s.provider || "PROVIDER1"
                }));
            }

            allServices = services2.filter(s => s.serviceId && s.name);
            renderServices(allServices);

        } catch (err2) {
            console.error("❌ ALL SERVICE ATTEMPTS FAILED:", err2);

            container.innerHTML = `
                <div class="error-box" style="color: #ff4d4d; padding: 20px; text-align: center; border: 1px solid #ff4d4d; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle"></i><br>
                    <strong>Failed to load services</strong><br>
                    <small>Please refresh the page or contact support if the issue persists.</small>
                </div>
            `;
        }
    }
}
