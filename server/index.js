useEffect(() => {
    console.log("Running useEffect on load");

    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const storedToken = localStorage.getItem("tiktok_access_token");

    console.log("URL token param:", token);
    console.log("Stored token:", storedToken);

    if (token && token === storedToken) {
        console.log("Token already exists and matches stored token. Skipping...");
        window.history.replaceState({}, "", "/");
        return;
    }

    if (token && !storedToken) {
        localStorage.setItem("tiktok_access_token", token);
        console.log("Access token stored in localStorage");
        window.history.replaceState({}, "", "/");
        console.log("URL cleaned of token");
    }
}, []);