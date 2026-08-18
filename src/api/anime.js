import axios from "axios";

// Panggil langsung API target tanpa lewat serverless function Vercel
const BASE_URL = "https://www.sankavollerei.web.id/anime/animasu";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const getHomeAnime = (page = 1) => API.get(`/home?page=${page}`);
export const getPopularAnime = (page = 1) => API.get(`/popular?page=${page}`);
export const getMoviesAnime = (page = 1) => API.get(`/movies?page=${page}`);
export const getOngoingAnime = (page = 1) => API.get(`/ongoing?page=${page}`);
export const getGenres = () => API.get(`/genres`);
export const searchAnime = (query, page = 1) => API.get(`/search/${encodeURIComponent(query)}?page=${page}`);
export const getAnimeDetail = (slug) => API.get(`/detail/${slug}`);
export const getEpisodeDetail = (slug) => API.get(`/episode/${slug}`);
