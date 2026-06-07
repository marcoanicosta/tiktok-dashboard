const express = require("express");
const axios = require("axios");
const cors = require("cors");
const qs = require("qs");
require("dotenv").config();

const app = express();
app.use(cors());

const path = require("path");
app.use(express.static(path.join(__dirname, "../client/build")));

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const POST_OAUTH_APP_URL = (
  process.env.POST_OAUTH_APP_URL || "https://social-metrics-8roi.onrender.com"
).replace(/\/$/, "");

// Step 1: Redirect user to TikTok OAuth
app.get("/auth/tiktok", (req, res) => {
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic,user.info.stats,video.list&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

async function handleTiktokCallback(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code received");

    try {
        const response = await axios.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            qs.stringify({
                client_key: CLIENT_KEY,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const tokenData = response.data?.data ?? response.data;
        if (!tokenData?.access_token) {
            return res.status(500).send("Authentication failed: Token not returned");
        }

        const { access_token, open_id, refresh_token } = tokenData;
        const redirect = new URL(POST_OAUTH_APP_URL);
        redirect.searchParams.set("access_token", access_token);
        if (open_id) redirect.searchParams.set("open_id", open_id);
        if (refresh_token) redirect.searchParams.set("refresh_token", refresh_token);
        res.redirect(redirect.toString());
    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        res.status(500).send("Authentication failed");
    }
}

app.get("/auth/tiktok/callback", handleTiktokCallback);
app.get("/auth/tiktok/callback/", handleTiktokCallback);

// Fetch TikTok user metrics
app.get("/tiktok/profile", async (req, res) => {
    const { access_token } = req.query;
    if (!access_token) return res.status(400).send("Missing access token");

    try {
        const response = await axios.get(
            "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,heart_count,video_count",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching profile data:", error.response?.data || error.message);
        res.status(500).json(error.response?.data || { error: error.message });
    }
});

const PORT = process.env.PORT || 5002;

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} 📟...`));