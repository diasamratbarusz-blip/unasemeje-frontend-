(function() {
    const ADMIN_EMAIL = "diasamratbarusz@gmail.com";
    const ADMIN_PHONE = "0715509440";
    const token = localStorage.getItem("token");

    // 1. If not logged in at all, send to login page
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // 2. Decode token to check identity (without needing a backend call first)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isOwner = payload.email === ADMIN_EMAIL || payload.phone === ADMIN_PHONE;

        // 3. If they are on the admin page but ARE NOT you, kick them out
        if (window.location.pathname.includes("admin") && !isOwner) {
            window.location.href = "dashboard.html";
        }
    } catch (e) {
        localStorage.clear();
        window.location.href = "index.html";
    }
})();
