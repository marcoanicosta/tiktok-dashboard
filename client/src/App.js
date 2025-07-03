import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
    console.log("Rendering App component");

    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);

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
            console.log("Finished useEffect");
            return;
        }

        if (token && !storedToken) {
            localStorage.setItem("tiktok_access_token", token);
            console.log("Access token stored in localStorage");
            window.history.replaceState({}, "", "/");
            console.log("URL cleaned of token");
        }
        console.log("Finished useEffect");
    }, []);

    const handleLogin = () => {
        window.location.href = "https://www.tiktok.com/v2/auth/authorize/?client_key=sbawx8ddego60n8lsv&scope=user.info.basic,user.info.stats,video.list&response_type=code&redirect_uri=https%3A%2F%2Ftiktok-dashboard.onrender.com%2Fauth%2Ftiktok%2Fcallback";
    };

    const fetchProfile = async () => {
        const access_token = localStorage.getItem("tiktok_access_token");

        if (!access_token) return alert("Please log in first!");

        try {
            const res = await axios.get(`https://tiktok-dashboard.onrender.com/tiktok/profile?access_token=${access_token}`);
            setProfile(res.data);
            console.log("Profile data fetched:", res.data);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchVideos = async () => {
        const access_token = localStorage.getItem("tiktok_access_token");
        if (!access_token) return alert("Please log in first!");

        try {
            const videoListRes = await axios.post(
                "https://open.tiktokapis.com/v2/video/list/?fields=id,title",
                { max_count: 10 },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            const videoIds = videoListRes.data.data.videos.map(v => v.id);

            const videoStatsRes = await axios.post(
                "https://open.tiktokapis.com/v2/video/query/?fields=id,title,like_count,view_count,comment_count,share_count",
                {
                    filters: { video_ids: videoIds }
                },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            setVideos(videoStatsRes.data.data.videos || []);
            console.log("Fetched video stats:", videoStatsRes.data.data.videos || []);
        } catch (err) {
            console.error("Error fetching video stats:", err);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>TikTok Dashboard</h1>
            {!profile ? (
                <>
                    <button onClick={handleLogin}>Login with TikTok</button>
                    <button onClick={fetchProfile}>Fetch Profile</button>
                    <button onClick={fetchVideos}>Fetch Video Stats</button>
                </>
            ) : (
                <div>
                    <h2>{profile.data?.display_name}</h2>
                    <img src={profile.data?.avatar_url} alt="Avatar" width="100" style={{ borderRadius: "50%" }} />
                    <p>User ID: {profile.data?.open_id}</p>
                </div>
            )}
            {videos.length > 0 && (
                <table style={{ margin: "20px auto", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Title</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Views</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Likes</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Comments</th>
                            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Shares</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.map((video, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{video.title}</td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{video.view_count}</td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{video.like_count}</td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{video.comment_count}</td>
                                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{video.share_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default App;
