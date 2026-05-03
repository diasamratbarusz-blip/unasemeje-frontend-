/**
 * =========================================
 * LOAD SERVICES
 * =========================================
 * Fetches and parses services from the backend.
 * Handles both grouped (by platform/type) and flat responses.
 * Author: unasemeje ø dia SMM
 */

// Global variable to store services for filtering/search
let allServices = [];

async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    // Show loading state with brand-specific messaging
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 40px; color: #10b981;">
            <i class="fas fa-circle-notch fa-spin fa-2x"></i>
            <p style="margin-top: 15px;">🔄 Syncing latest services from African markets...</p>
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
        // This handles the platform -> type -> service hierarchy found in the backend
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
        // duplicate-check based on ID + Provider
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
                <div class="error-box" style="color: #ff4d4d; padding: 20px; text-align: center; border: 1px solid #ff4d4d; border-radius: 8px; background: rgba(255, 77, 77, 0.1);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                    <strong>Failed to load services</strong><br>
                    <small>Please refresh the page or contact support if the issue persists.</small>
                </div>
            `;
        }
    }
}

/**
 * UTILS: Text Cleaning for consistent UI
 */
function cleanText(text) {
    return String(text || "")
        .replace(/\[.*?\]/g, "")
        .replace(/\{.*?\}/g, "")
        .trim();
}

/**
 * UTILS: Platform Detection for Icons/Filtering
 */
function detectPlatform(s) {
    const text = `${s.name} ${s.category}`.toLowerCase();
    if (text.includes("tiktok") || text.includes("tt ")) return "TikTok";
    if (text.includes("instagram") || text.includes("ig ")) return "Instagram";
    if (text.includes("facebook") || text.includes("fb ")) return "Facebook";
    if (text.includes("youtube") || text.includes("yt ")) return "YouTube";
    if (text.includes("telegram") || text.includes("tg ")) return "Telegram";
    if (text.includes("twitter") || text.includes("x ")) return "Twitter/X";
    return "Other";
}
