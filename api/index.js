import express from "express";
import cors from "cors";
import axios from "axios";
import NodeCache from "node-cache";

const app = express();
const cache = new NodeCache({ stdTTL: 300 });
const BASE_URL = process.env.BASE_API_URL || "https://www.sankavollerei.web.id/anime";

app.use(cors());
app.use(express.json());

const fetchWithCache = async (url, res) => {
  try {
    const cachedData = cache.get(url);
    if (cachedData) return res.json(cachedData);

    const response = await axios.get(url, {
      timeout: 8000, // Tambahkan timeout 8 detik
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.sankavollerei.web.id/"
      },
    });

    cache.set(url, response.data);
    return res.json(response.data);
  } catch (error) {
    console.error("Proxy Error:", error.message);
    return res.status(500).json({ error: true, message: error.message, data: [] });
  }
};

app.get("/api/animasu/home", (req, res) => fetchWithCache(`${BASE_URL}/animasu/home?page=${req.query.page || 1}`, res));
app.get("/api/animasu/popular", (req, res) => fetchWithCache(`${BASE_URL}/animasu/popular?page=${req.query.page || 1}`, res));
app.get("/api/animasu/movies", (req, res) => fetchWithCache(`${BASE_URL}/animasu/movies?page=${req.query.page || 1}`, res));
app.get("/api/animasu/ongoing", (req, res) => fetchWithCache(`${BASE_URL}/animasu/ongoing?page=${req.query.page || 1}`, res));
app.get("/api/animasu/latest", (req, res) => fetchWithCache(`${BASE_URL}/animasu/latest?page=${req.query.page || 1}`, res));
app.get("/api/animasu/genres", (req, res) => fetchWithCache(`${BASE_URL}/animasu/genres`, res));
app.get("/api/animasu/search", (req, res) => fetchWithCache(`${BASE_URL}/animasu/search/${encodeURIComponent(req.query.query || "")}?page=${req.query.page || 1}`, res));
app.get("/api/animasu/detail/:slug", (req, res) => fetchWithCache(`${BASE_URL}/animasu/detail/${req.params.slug}`, res));
app.get("/api/animasu/episode/:slug", (req, res) => fetchWithCache(`${BASE_URL}/animasu/episode/${req.params.slug}`, res));

export default app;
app.get("/api/animasu/latest", (req, res) => fetchWithCache(`${BASE_URL}/animasu/latest?page=${req.query.page || 1}`, res));
app.get("/api/animasu/genres", (req, res) => fetchWithCache(`${BASE_URL}/animasu/genres`, res));
app.get("/api/animasu/search", (req, res) => fetchWithCache(`${BASE_URL}/animasu/search/${encodeURIComponent(req.query.query || "")}?page=${req.query.page || 1}`, res));
app.get("/api/animasu/detail/:slug", (req, res) => fetchWithCache(`${BASE_URL}/animasu/detail/${req.params.slug}`, res));
app.get("/api/animasu/episode/:slug", (req, res) => fetchWithCache(`${BASE_URL}/animasu/episode/${req.params.slug}`, res));

// Disesuaikan untuk Vercel Serverless Function
export default app;
