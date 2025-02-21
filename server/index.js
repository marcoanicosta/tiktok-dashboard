const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Step 1: Redirect user to TikTok OAuth
app.get("/auth/tiktok", (req, res) => {
    const authUrl = `https://open-api.tiktok.com/platform/oauth/connect/?client_key=${CLIENT_KEY}&scope=user.info.basic,user.stats&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// Step 2: Handle TikTok OAuth callback and exchange code for access token
app.get("/auth/tiktok/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code received");

    try {
        const response = await axios.post("https://open-api.tiktok.com/oauth/access_token/", {
            client_key: CLIENT_KEY,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
        });

        const { access_token, open_id } = response.data.data;
        res.json({ access_token, open_id });
    } catch (error) {
        console.error("Error exchanging code for token:", error);
        res.status(500).send("Authentication failed");
    }
});

app.listen(5002, () => console.log("Server running on port 5002 📟..."));


// Fetch TikTok user metrics
app.get("/tiktok/profile", async (req, res) => {
    const { access_token, open_id } = req.query;
    if (!access_token) return res.status(400).send("Missing access token");

    try {
        const response = await axios.get(`https://open-api.tiktok.com/user/info/?fields=follower_count,heart_count,video_count`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).send("Failed to fetch profile data");
    }
});