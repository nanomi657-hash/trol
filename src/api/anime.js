import axios from "axios";

// Menggunakan relative path agar otomatis menyesuaikan dengan domain Vercel
const API = axios.create({
  baseURL: "/api/animasu",
  timeout: 10000,
});

export const getHomeAnime = (page = 1) => API.get(`/home?page=${page}`);
export const getPopularAnime = (page = 1) => API.get(`/popular?page=${page}`);
export const getMoviesAnime = (page = 1) => API.get(`/movies?page=${page}`);
export const getOngoingAnime = (page = 1) => API.get(`/ongoing?page=${page}`);
export const getGenres = () => API.get(`/genres`);
export const searchAnime = (query, page = 1) => API.get(`/search?query=${encodeURIComponent(query)}&page=${page}`);
export const getAnimeDetail = (slug) => API.get(`/detail/${slug}`);
export const getEpisodeDetail = (slug) => API.get(`/episode/${slug}`);
