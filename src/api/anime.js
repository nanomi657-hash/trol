import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
});

export const getHomeAnime = (page = 1) => api.get(`/animasu/home?page=${page}`);
export const getPopularAnime = (page = 1) => api.get(`/animasu/popular?page=${page}`);
export const getMoviesAnime = (page = 1) => api.get(`/animasu/movies?page=${page}`);
export const getOngoingAnime = (page = 1) => api.get(`/animasu/ongoing?page=${page}`);
export const getLatestAnime = (page = 1) => api.get(`/animasu/latest?page=${page}`);
export const searchAnime = (query, page = 1) => api.get(`/animasu/search?query=${query}&page=${page}`);
export const getGenres = () => api.get(`/animasu/genres`);
export const getAnimeDetail = (slug) => api.get(`/animasu/detail/${slug}`);
export const getEpisodeDetail = (slug) => api.get(`/animasu/episode/${slug}`);
