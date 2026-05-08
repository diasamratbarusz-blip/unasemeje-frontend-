/**
 * =========================================
 * LOAD SERVICES - unasemeje ø dia SMM
 * =========================================
 * Fetches, parses, and renders services.
 * Handles grouped, flat, and fallback API routes.
 */

// Configuration - Matches your auth.js and app.js
const API_URL = "https://unasemeje-backend-3.onrender.com/api";

// Global variable for filtering/search
let allServices = [];

async function loadServices() {
    const container = document.getElementById("serviceList");
    if (!container) return;

    // Show loading state with brand-specific messaging
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 40px; color: #10b981;">
            <i class="fas fa-circle-notch fa-spin fa-2x"></i>
            <p style="margin-top: 15px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;">
                🔄 Syncing latest services from African markets...
            </p>
        </div>
    `;

    try {
        const res = await fetch(API_URL + "/services");
        if (!res.ok) throw new Error("Failed to fetch primary services");

        const json = await res.json();
        console.log("🔥 RAW SERVICES RESPONSE:", json);

        let services = [];

        /* ================= HANDLE GROUPED RESPONSE ================= */
        if (json?.success && json.data && typeof json.data === "object" && !Array.isArray(json.data)) {
            Object.keys(json.data).forEach(platform => {
                const platformData = json.data[platform];
                Object.keys(platformData).forEach(type => {
                    platformData[type].forEach(s => {
                        services.push({
                            serviceId: String(s.serviceId || s.id || ""),
                            name: cleanText(s.name || "Unnamed Service"),
                            rate: Number(s.sellingRate || s.rate || s.price || 0),
                            min: Number(s.min || 1),
                            max: Number(s.max || 10000),
                            category: s.category || type,
                            platform: platform,
                            provider: s.provider || "PROVIDER1"
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
                rate: Number(s.sellingRate || s.rate || s.price || 0),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: s.platform || detectPlatform(s),
                provider: s.provider || "PROVIDER1"
            }));
        }

        if (!services.length) throw new Error("No services found");

        processAndRender(services);

    } catch (err) {
        console.warn("⚠️ Primary route failed, attempting fallback...", err);
        handleFallback(container);
    }
}

/**
 * Fallback logic for external-services route
 */
async function handleFallback(container) {
    try {
        const res2 = await fetch(API_URL + "/external-services");
        if (!res2.ok) throw new Error("External API route failed");

        const json2 = await res2.json();
        const list2 = json2.data || json2;
        let services2 = [];

        if (Array.isArray(list2)) {
            services2 = list2.map(s => ({
                serviceId: String(s.serviceId || s.id || ""),
                name: cleanText(s.name || "Unnamed Service"),
                rate: Number(s.sellingRate || s.rate || s.price || 0),
                min: Number(s.min || 1),
                max: Number(s.max || 10000),
                category: s.category || "Other",
                platform: detectPlatform(s),
                provider: s.provider || "PROVIDER1"
            }));
        }

        processAndRender(services2);

    } catch (err2) {
        container.innerHTML = `
            <div class="error-box" style="color: #ef4444; padding: 30px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; background: rgba(239, 68, 68, 0.05);">
                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 10px;"></i><br>
                <strong style="font-size: 1.1rem;">Service Sync Failed</strong><br>
                <p style="margin-top: 10px; opacity: 0.8;">Our systems are temporarily unable to fetch prices. Please refresh or try again later.</p>
                <button onclick="loadServices()" style="background: #10b981; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px;">Retry Now</button>
            </div>
        `;
    }
}

/**
 * Filter, Clean, and Trigger Render
 */
function processAndRender(services) {
    // Remove invalid & Remove duplicates
    let cleaned = services.filter(s => s.serviceId && s.name && !isNaN(s.rate));
    allServices = [
        ...new Map(cleaned.map(s => [`${s.provider}_${s.serviceId}`, s])).values()
    ];

    console.log("✅ CLEAN SERVICES LOADED:", allServices.length);
    renderServices(allServices);
}

/**
 * RENDER SERVICES TO UI
 */
function renderServices(data) {
    const container = document.getElementById("serviceList");
    if (!container) return;

    if (!data.length) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>No services matching your criteria.</p>";
        return;
    }

    container.innerHTML = data.map(s => `
        <div class="service-card" onclick="selectService('${s.serviceId}', '${s.name.replace(/'/g, "\\'")}')" 
             style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; transition: 0.3s;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; color: #10b981; font-weight: 800; letter-spacing: 1px;">${s.platform}</span>
                    <h4 style="margin: 5px 0; font-size: 14px; color: #fff;">${s.name}</h4>
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">ID: ${s.serviceId} | Min: ${s.min} - Max: ${s.max}</p>
                </div>
                <div style="text-align: right;">
                    <span style="display: block; color: #10b981; font-weight: 900; font-size: 16px;">KES ${s.rate}</span>
                    <small style="color: rgba(255,255,255,0.3); font-size: 10px;">per 1000</small>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Handle Service Selection
 */
function selectService(id, name) {
    const input = document.getElementById("service");
    if (input) {
        input.value = id;
        if (window.showToast) {
            showToast(`Selected: ${name}`);
        } else {
            alert(`Selected: ${name}`);
        }
    }
}

/**
 * UTILS: Text Cleaning
 */
function cleanText(text) {
    return String(text || "").replace(/\[.*?\]/g, "").replace(/\{.*?\}/g, "").trim();
}

/**
 * UTILS: Platform Detection
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

// Auto-init
document.addEventListener("DOMContentLoaded", loadServices);
