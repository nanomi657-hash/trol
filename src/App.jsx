import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Home,
  Search,
  Bookmark,
  History,
  Grid,
  PlayCircle,
  ArrowLeft,
  Loader2,
  ImageOff,
  Flame,
  Tv,
  Film,
  Calendar,
  Info,
  X,
  MessageSquare
} from "lucide-react";
import {
  getHomeAnime,
  getPopularAnime,
  getMoviesAnime,
  getOngoingAnime,
  getGenres,
  searchAnime,
  getAnimeDetail,
  getEpisodeDetail,
} from "./api/anime";
import axios from "axios";

// --- Helpers Rekursif ---
const findArrayInObject = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== "object") return [];

  const priorityKeys = ["data", "result", "anime", "items", "list", "episodes", "episode_list", "genres", "schedule"];
  for (const key of priorityKeys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
  }

  for (const key in obj) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      return obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = findArrayInObject(obj[key]);
      if (found.length > 0) return found;
    }
  }
  return [];
};

const extractImage = (item) => {
  if (!item || typeof item !== "object") return "";
  const keys = ["thumbnail", "image", "thumb", "cover", "poster", "img", "src"];
  for (const key of keys) {
    if (item[key] && typeof item[key] === "string" && item[key].startsWith("http")) return item[key];
  }
  for (const key in item) {
    if (typeof item[key] === "object" && item[key] !== null) {
      const nested = extractImage(item[key]);
      if (nested) return nested;
    }
  }
  return "";
};

const extractStreamUrl = (obj) => {
  if (!obj) return "";
  if (typeof obj === "string" && (obj.startsWith("http") || obj.startsWith("//"))) return obj;
  const streamKeys = ["streamUrl", "stream_url", "stream_link", "stream", "iframe", "embed", "url", "link", "file"];
  for (const key of streamKeys) {
    if (obj[key] && typeof obj[key] === "string" && (obj[key].startsWith("http") || obj[key].startsWith("//"))) return obj[key];
  }
  if (Array.isArray(obj.servers) && obj.servers.length > 0) return extractStreamUrl(obj.servers[0]);
  if (Array.isArray(obj.stream) && obj.stream.length > 0) return extractStreamUrl(obj.stream[0]);
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = extractStreamUrl(obj[key]);
      if (found) return found;
    }
  }
  return "";
};

const extractString = (item, keys) => {
  if (!item) return "";
  for (const key of keys) {
    if (item[key] && typeof item[key] === "string") return item[key];
  }
  return "";
};

const extractSlug = (item) => {
  const raw = extractString(item, ["slug", "endpoint", "link", "url", "id"]);
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^\/anime\/animasu\/(detail|episode|genre)\//, "")
    .replace(/^\/|\/$/g, "");
};

// --- Component Animated Text LIQUID STREAM ---
const LiquidStreamTitle = () => {
  const text = "LIQUID STREAM";
  const [keyCount, setKeyCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKeyCount((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key={keyCount}
      className="flex justify-center items-center overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.8 },
            visible: { opacity: 1, y: 0, scale: 1 },
          }}
          className={`text-xl sm:text-2xl font-extrabold tracking-wider ${
            char === " " ? "mr-2" : "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          }`}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [categoryMenu, setCategoryMenu] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [animeList, setAnimeList] = useState([]);
  const [heroAnimeList, setHeroAnimeList] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [genresList, setGenresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAnime, setSavedAnime] = useState(() => JSON.parse(localStorage.getItem("savedAnime") || "[]"));
  const [historyAnime, setHistoryAnime] = useState(() => JSON.parse(localStorage.getItem("historyAnime") || "[]"));

  const [loading, setLoading] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);

  useEffect(() => localStorage.setItem("savedAnime", JSON.stringify(savedAnime)), [savedAnime]);
  useEffect(() => localStorage.setItem("historyAnime", JSON.stringify(historyAnime)), [historyAnime]);

  // Cek Hash URL saat pertama kali muat / refresh
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/detail/")) {
        const slug = hash.replace("#/detail/", "");
        if (slug) fetchDetailData(slug);
      } else if (hash.startsWith("#/episode/")) {
        const slug = hash.replace("#/episode/", "");
        if (slug) fetchEpisodeData(slug);
      }
    };

    handleHashChange();
  }, []);

  useEffect(() => {
    getPopularAnime(1).then((res) => {
      const list = findArrayInObject(res.data);
      setHeroAnimeList(list.slice(0, 5));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (heroAnimeList.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroAnimeList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroAnimeList]);

  // Handle Fetch Data Utama
  useEffect(() => {
    if (activeDetail || activeEpisode || selectedGenre) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        if (categoryMenu) {
          switch (categoryMenu) {
            case "popular": res = await getPopularAnime(); break;
            case "ongoing": res = await getOngoingAnime(); break;
            case "movies": res = await getMoviesAnime(); break;
            case "schedule": 
              res = await axios.get("https://www.sankavollerei.web.id/anime/animasu/schedule");
              break;
            default: break;
          }
        } else if (activeTab === "home") {
          res = await getHomeAnime();
        } else if (activeTab === "genre") {
          res = await getGenres();
          setGenresList(findArrayInObject(res.data));
          setLoading(false);
          return;
        }

        if (res && res.data) {
          setAnimeList(findArrayInObject(res.data));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, categoryMenu, activeDetail, activeEpisode, selectedGenre]);

  // Fetch Anime berdasarkan Genre yang Dipilih
  const handleSelectGenre = async (genreItem) => {
    const slug = extractSlug(genreItem) || genreItem.name || genreItem.title;
    if (!slug) return;

    setLoading(true);
    setSelectedGenre(genreItem);
    try {
      const res = await axios.get(`https://www.sankavollerei.web.id/anime/animasu/genre/${slug.toLowerCase()}?page=1`);
      if (res && res.data) {
        setAnimeList(findArrayInObject(res.data));
      }
    } catch (err) {
      console.error("Genre Error:", err);
      alert("Gagal memuat anime berdasarkan genre ini.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveDetail(null);
    setActiveEpisode(null);
    setSelectedGenre(null);
    window.location.hash = "";
    try {
      const res = await searchAnime(searchQuery);
      if (res && res.data) {
        setAnimeList(findArrayInObject(res.data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailData = async (slug) => {
    setLoading(true);
    try {
      const res = await getAnimeDetail(slug);
      const data = res.data?.data || res.data;
      if (data) {
        setActiveDetail(data);
        setActiveEpisode(null);
        window.location.hash = `#/detail/${slug}`;
        setHistoryAnime((prev) => [data, ...prev.filter((i) => extractSlug(i) !== slug)]);
      }
    } catch (err) {
      console.error("Detail Error:", err);
      alert("Gagal memuat detail anime.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodeData = async (slug) => {
    setLoading(true);
    try {
      const res = await getEpisodeDetail(slug);
      const data = res.data?.data || res.data;
      if (data) {
        setActiveEpisode(data);
        window.location.hash = `#/episode/${slug}`;
      } else {
        alert("Pilihan episode tidak tersedia.");
      }
    } catch (err) {
      console.error("Episode Error:", err);
      alert("Terjadi kesalahan koneksi saat memuat video.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnime = (item) => {
    const slug = extractSlug(item);
    if (slug) fetchDetailData(slug);
  };

  const handleSelectEpisode = (ep) => {
    const slug = extractSlug(ep);
    if (slug) fetchEpisodeData(slug);
  };

  const resetState = () => {
    setActiveDetail(null);
    setActiveEpisode(null);
    setSelectedGenre(null);
    window.location.hash = "";
  };

  const toggleSaveAnime = (anime) => {
    const slug = extractSlug(anime);
    const exists = savedAnime.some((item) => extractSlug(item) === slug);
    if (exists) {
      setSavedAnime((prev) => prev.filter((item) => extractSlug(item) !== slug));
    } else {
      setSavedAnime((prev) => [...prev, anime]);
    }
  };

  return (
    <div className="min-h-screen liquid-bg text-slate-200 pb-20 relative overflow-x-hidden">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-liquid bg-liquid-bg/80 border-b border-liquid-border px-4 py-3 flex items-center justify-between">
        
        {/* Logo Bulat & Title */}
        <div 
          onClick={() => { resetState(); setActiveTab("home"); setCategoryMenu(""); }}
          className="flex items-center gap-3 cursor-pointer mx-auto"
        >
          <img 
            src="https://files.catbox.moe/zh57ll.jpg" 
            alt="Logo" 
            className="w-9 h-9 rounded-full object-cover border border-purple-500/50 shadow-lg shadow-purple-500/20"
          />
          <LiquidStreamTitle />
        </div>
        
        {/* Menu Titik Tiga Top Right */}
        <div className="relative absolute right-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-liquid-bg/95 border border-liquid-border backdrop-blur-xl rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
              >
                {[
                  { id: "popular", label: "Popular", icon: Flame },
                  { id: "ongoing", label: "Ongoing", icon: Tv },
                  { id: "movies", label: "Movie", icon: Film },
                  { id: "schedule", label: "Schedule", icon: Calendar },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCategoryMenu(item.id);
                        resetState();
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        categoryMenu === item.id
                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                          : "hover:bg-white/5 text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setIsInfoModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all border-t border-liquid-border/50 mt-1"
                >
                  <Info className="w-4 h-4 text-purple-400" />
                  <span>Info</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Info Modal */}
      <AnimatePresence>
        {isInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-liquid-card border border-liquid-border p-6 rounded-2xl max-w-sm w-full relative shadow-2xl backdrop-blur-xl text-center space-y-4"
            >
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-purple-500/50 shadow-lg shadow-purple-500/30">
                <img 
                  src="https://files.catbox.moe/zh57ll.jpg" 
                  alt="Developer Logo" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold">Developer</p>
                <h3 className="text-xl font-bold text-white">Xynn</h3>
              </div>

              <a
                href="https://whatsapp.com/channel/0029Vb8yMdiIt5rnDLcmnX1z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/30 border border-green-500/40 text-green-300 rounded-full text-xs font-medium hover:bg-green-600/40 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Channel WhatsApp</span>
              </a>

              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Website ini dibuat menggunakan bahasa pemrograman <strong>React.js</strong> dan <strong>Tailwind</strong> dan juga menggunakan API dari <strong>Sanka Vollerei</strong>.
              </p>

              <div className="pt-2 border-t border-liquid-border text-[11px] text-slate-500 font-medium">
                © LIQUID STREAM 2026
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section Carousel */}
      {!activeDetail && !activeEpisode && heroAnimeList.length > 0 && activeTab === "home" && !categoryMenu && !selectedGenre && (
        <section className="max-w-7xl mx-auto px-6 pt-6">
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-liquid-border group">
            <AnimatePresence mode="wait">
              {heroAnimeList[heroIndex] && (
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => handleSelectAnime(heroAnimeList[heroIndex])}
                >
                  <img
                    src={extractImage(heroAnimeList[heroIndex])}
                    alt="Hero Poster"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-liquid-bg via-liquid-bg/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <span className="px-3 py-1 bg-purple-600/80 backdrop-blur-md rounded-full text-xs font-semibold text-white inline-block">
                      Featured Series
                    </span>
                    <h2 className="text-xl sm:text-3xl font-bold text-white line-clamp-1">
                      {extractString(heroAnimeList[heroIndex], ["title", "name"])}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-4 right-6 flex gap-2 z-10">
              {heroAnimeList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === heroIndex ? "w-6 bg-purple-400" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="mt-4 text-sm text-slate-400">Memuat konten liquid...</p>
          </div>
        ) : activeEpisode ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button
              onClick={() => {
                const animeSlug = extractSlug(activeDetail) || extractSlug(activeEpisode);
                if (animeSlug) {
                  fetchDetailData(animeSlug);
                } else {
                  resetState();
                }
              }}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Detail
            </button>
            <div className="bg-liquid-card border border-liquid-border rounded-2xl p-4 backdrop-blur-md">
              <h1 className="text-xl font-semibold mb-4">
                {extractString(activeEpisode, ["title", "name"]) || "Streaming Episode"}
              </h1>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-liquid-border">
                {extractStreamUrl(activeEpisode) ? (
                  <iframe
                    src={extractStreamUrl(activeEpisode)}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video Player"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6">
                    <PlayCircle className="w-12 h-12 mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Stream player tidak ditemukan dari server.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeDetail ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={resetState}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>

              <button
                onClick={() => toggleSaveAnime(activeDetail)}
                className={`p-2.5 rounded-full border border-liquid-border backdrop-blur-md transition-all ${
                  savedAnime.some((i) => extractSlug(i) === extractSlug(activeDetail))
                    ? "bg-purple-600 text-white"
                    : "bg-liquid-glass text-slate-300 hover:text-white"
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-liquid-card border border-liquid-border p-6 rounded-2xl backdrop-blur-md">
              <div className="space-y-4">
                {extractImage(activeDetail) ? (
                  <img
                    src={extractImage(activeDetail)}
                    alt="Poster"
                    className="w-full rounded-xl object-cover border border-liquid-border shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-slate-800/50 rounded-xl border border-liquid-border flex flex-col items-center justify-center text-slate-500">
                    <ImageOff className="w-10 h-10 mb-2" />
                    <span className="text-xs">No Poster</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-4">
                <h1 className="text-3xl font-bold text-white">
                  {extractString(activeDetail, ["title", "name"])}
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {extractString(activeDetail, ["synopsis", "desc", "description"]) || "Tidak ada sinopsis."}
                </p>

                <h3 className="text-lg font-semibold pt-4 border-t border-liquid-border">Daftar Episode</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                  {findArrayInObject(activeDetail).map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectEpisode(ep)}
                      className="p-2.5 text-xs text-left bg-liquid-glass hover:bg-purple-600/20 border border-liquid-border rounded-lg transition-all truncate flex items-center gap-2"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="truncate">
                        {extractString(ep, ["title", "name", "episode"]) || `Episode ${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {activeTab === "search" && (
              <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
                <input
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-liquid-glass border border-liquid-border rounded-full py-2.5 pl-11 pr-4 text-sm backdrop-blur-md focus:outline-none focus:border-purple-500/50 text-white placeholder-slate-400"
                />
                <Search className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
              </form>
            )}

            {/* List Pilihan Genre */}
            {activeTab === "genre" && !selectedGenre && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                {genresList.map((g, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectGenre(g)}
                    className="p-4 rounded-xl bg-liquid-card border border-liquid-border backdrop-blur-md hover:border-purple-500/50 hover:bg-purple-600/10 transition-all text-center cursor-pointer font-medium text-sm text-purple-300"
                  >
                    {extractString(g, ["name", "title", "genre"])}
                  </div>
                ))}
              </div>
            )}

            {/* Header saat Genre / Menu aktif */}
            {selectedGenre && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-purple-300">
                  Genre: {extractString(selectedGenre, ["name", "title", "genre"])}
                </h2>
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="text-xs text-slate-400 hover:text-white border border-liquid-border px-3 py-1 rounded-full"
                >
                  Ganti Genre
                </button>
              </div>
            )}

            {categoryMenu === "schedule" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-purple-300">Jadwal Rilis Anime (Schedule)</h2>
              </div>
            )}

            {activeTab === "save" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-300">Anime Disimpan</h2>
                {savedAnime.length === 0 && <p className="text-sm text-slate-500">Belum ada anime yang disimpan.</p>}
              </div>
            )}

            {activeTab === "history" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-300">Riwayat Tontonan</h2>
                {historyAnime.length === 0 && <p className="text-sm text-slate-500">Belum ada riwayat tontonan.</p>}
              </div>
            )}

            {/* Render List Card Anime */}
            {(activeTab !== "genre" || selectedGenre) && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {(activeTab === "save" ? savedAnime : activeTab === "history" ? historyAnime : animeList).map((item, index) => {
                  const imageSrc = extractImage(item);
                  const titleText = extractString(item, ["title", "name"]) || "Untitled";
                  const subText = extractString(item, ["episode", "status", "type", "day", "time"]);

                  return (
                    <motion.div
                      key={index}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectAnime(item)}
                      className="cursor-pointer group relative bg-liquid-card border border-liquid-border rounded-2xl overflow-hidden backdrop-blur-md flex flex-col justify-between"
                    >
                      <div className="aspect-[3/4] overflow-hidden relative bg-slate-800/50 flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={titleText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <ImageOff className="w-8 h-8 text-slate-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-liquid-bg via-transparent to-transparent opacity-80 pointer-events-none" />
                      </div>
                      <div className="p-4 relative z-10">
                        <h2 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {titleText}
                        </h2>
                        {subText && <p className="text-xs text-slate-500 mt-1">{subText}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-liquid bg-liquid-bg/80 border-t border-liquid-border px-4 py-2 flex justify-around items-center max-w-md mx-auto sm:rounded-t-2xl">
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "search", label: "Search", icon: Search },
          { id: "save", label: "Save", icon: Bookmark },
          { id: "history", label: "History", icon: History },
          { id: "genre", label: "Genre", icon: Grid },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !categoryMenu && !activeDetail && !activeEpisode;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCategoryMenu("");
                resetState();
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? "text-purple-400 scale-110" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
