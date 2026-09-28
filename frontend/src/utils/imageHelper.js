// frontend/src/utils/imageHelper.js
// Helper terpusat untuk resolusi URL gambar (wisata + avatar)
// Menangani: Vercel (HTTPS), ngrok, localhost, relative paths

const RAW_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://numbness-afterglow-parade.ngrok-free.dev";

const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, "");

/**
 * Resolve URL gambar wisata.
 * @param {string|null} path - URL atau path gambar dari API
 * @param {string} fallback - URL fallback jika path kosong
 * @returns {string} URL lengkap yang bisa dipakai sebagai src <img>
 */
export const getImageUrl = (path, fallback = "/placeholder-wisata.svg") => {
  if (!path) return fallback;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;

  // Kalau sudah URL lengkap
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      // Jika URL ngrok bukan dari BACKEND_URL saat ini, ganti domain ke BACKEND_URL
      if (
        url.hostname.includes("ngrok") &&
        !path.startsWith(BACKEND_URL)
      ) {
        return `${BACKEND_URL}${url.pathname}${url.search}`;
      }
    } catch {
      // ignore invalid URL
    }
    return path;
  }

  // Path relatif: /uploads/..., uploads/..., /images/..., atau assets/...
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Kalau path lokal di public (assets/images/...), biarkan apa adanya
  if (cleanPath.startsWith("/assets/")) {
    return cleanPath;
  }

  // Semua path lain → prepend BACKEND_URL
  return `${BACKEND_URL}${cleanPath}`;
};

/**
 * Resolve URL avatar user.
 * @param {string|null} path - Avatar path dari user object (foto_profil / avatar)
 * @param {string} name - Nama user untuk UI Avatars fallback
 * @returns {string} URL avatar
 */
export const getAvatarUrl = (path, name = "User") => {
  const uiAvatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=f43f5e&color=fff&bold=true&size=128`;

  if (!path) return uiAvatarFallback;
  return getImageUrl(path, uiAvatarFallback);
};
