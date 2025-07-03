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

// Step 1: Redirect user to TikTok OAuth
app.get("/auth/tiktok", (req, res) => {
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic,user.info.stats,video.list&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Step 2: Handle TikTok OAuth callback and exchange code for access token
app.get("/auth/tiktok/callback", async (req, res) => {
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

        console.log("Token exchange response:", response.data);

        if (!response.data || !response.data.access_token) {
            return res.status(500).send("Authentication failed: Token not returned");
        }

        const { access_token, open_id } = response.data;
        res.redirect(`http://localhost:3040/?access_token=${access_token}&open_id=${open_id}`);
    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        res.status(500).send("Authentication failed");
    }
});

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