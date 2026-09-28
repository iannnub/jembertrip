// frontend/src/utils/imageHelper.js
// Helper terpusat untuk resolusi URL gambar (wisata + avatar) dengan retry & multi-fallback
// Menangani: Vercel (HTTPS), ngrok tunnel, relative paths, CDN avatars

const RAW_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://numbness-afterglow-parade.ngrok-free.dev";

export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, "");
export const FALLBACK_PLACEHOLDER = "/placeholder-wisata.svg";

// Daftar CDN fallback avatar jika salah satu CDN lambat / down
export const AVATAR_FALLBACKS = [
  (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=e11d48&color=fff&bold=true&size=128`,
  (name) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=e11d48`,
];

/**
 * Resolve URL gambar wisata (menerima path string atau objek wisata)
 * @param {string|Object|null} input - Path gambar string atau object wisata { gambar, foto_url, ... }
 * @param {string} fallback - URL fallback jika path kosong
 * @returns {string} URL lengkap yang siap dimuat
 */
export const getImageUrl = (input, fallback = FALLBACK_PLACEHOLDER) => {
  if (!input) return fallback;

  // Mendukung input objek wisata atau path string
  let path =
    typeof input === "object"
      ? input.gambar || input.foto_url || input.foto || input.image_url
      : input;

  if (!path || typeof path !== "string") return fallback;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;

  // Kalau sudah URL lengkap (http/https)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      // Force HTTPS untuk menghindari mixed-content blocking di Vercel
      if (path.startsWith("http://")) {
        path = path.replace("http://", "https://");
      }

      const url = new URL(path);
      // Jika URL ngrok dari sesi lama/berbeda, sesuaikan ke BACKEND_URL saat ini
      if (url.hostname.includes("ngrok") && !path.startsWith(BACKEND_URL)) {
        return `${BACKEND_URL}${url.pathname}${url.search}`;
      }
      return path;
    } catch {
      // ignore parsing error, return as is
      return path;
    }
  }

  // Path relatif: /uploads/..., uploads/..., /images/..., atau assets/...
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Kalau path lokal di public bundle (/assets/images/...), biarkan apa adanya
  if (cleanPath.startsWith("/assets/")) {
    return cleanPath;
  }

  // Semua path relatif lain diarahkan ke BACKEND_URL
  return `${BACKEND_URL}${cleanPath}`;
};

// Alias ramah untuk getImageUrl
export const getWisataImageUrl = (wisata, fallback = FALLBACK_PLACEHOLDER) => {
  return getImageUrl(wisata, fallback);
};

/**
 * Resolve URL avatar user dengan multi-fallback CDN
 * @param {string|Object|null} userOrPath - User object atau path foto profil
 * @param {string} name - Nama user
 * @param {number} fallbackIndex - Index pilihan CDN avatar
 * @returns {string} URL avatar
 */
export const getAvatarUrl = (userOrPath, name = "User", fallbackIndex = 0) => {
  let path = null;
  let userName = name;

  if (typeof userOrPath === "object" && userOrPath !== null) {
    path =
      userOrPath.profile_image ||
      userOrPath.foto_profil ||
      userOrPath.avatar ||
      userOrPath.foto;
    userName =
      userOrPath.nama ||
      userOrPath.full_name ||
      userOrPath.username ||
      userOrPath.name ||
      name;
  } else if (typeof userOrPath === "string") {
    path = userOrPath;
  }

  const fallbackFn =
    AVATAR_FALLBACKS[fallbackIndex % AVATAR_FALLBACKS.length] ||
    AVATAR_FALLBACKS[0];
  const avatarFallback = fallbackFn(userName || "User");

  if (!path) return avatarFallback;
  return getImageUrl(path, avatarFallback);
};

export const getProfileImageUrl = (user, fallbackIndex = 0) => {
  return getAvatarUrl(user, "User", fallbackIndex);
};

/**
 * Preload image dengan retry logic (exponential backoff)
 * @param {string} src - URL gambar yang akan dipreload
 * @param {number} retries - Jumlah percobaan ulang jika gagal
 * @returns {Promise<string>}
 */
export function preloadImage(src, retries = 2) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryLoad = () => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => {
        attempts++;
        if (attempts <= retries) {
          setTimeout(tryLoad, 1000 * attempts);
        } else {
          reject(new Error(`Failed to load ${src} after ${retries} attempts`));
        }
      };
      img.src = src;
    };

    tryLoad();
  });
}
