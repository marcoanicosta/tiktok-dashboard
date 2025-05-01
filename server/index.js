const express = require("express");
const axios = require("axios");
const cors = require("cors");
const qs = require("qs");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Step 1: Redirect user to TikTok OAuth
app.get("/auth/tiktok", (req, res) => {
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
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
        res.json({ access_token, open_id });
    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
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