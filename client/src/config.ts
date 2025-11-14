// API Configuration

// Backend API adresi (Railway)
export const API_BASE_URL = "https://restaurant-order-system-production.up.railway.app";

// Dahili kullanım için tek isim
const API_URL = API_BASE_URL;

// WebSocket için (şimdilik prod'da aynı domaini kullan)
export const WS_URL = import.meta.env.VITE_WS_URL || "";

// Helper function to get full API URL
export const getApiUrl = (path: string) => {
  // API_URL tam URL, direkt birleştir
  return `${API_URL}${path}`;
};

// Helper function to get WebSocket URL
export const getWebSocketUrl = () => {
  // Eğer env'de tam bir ws adresi varsa onu kullan
  if (WS_URL && WS_URL.startsWith("ws")) {
    return WS_URL;
  }

  // Aksi halde, mevcut sitenin domainine göre üret
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}`;
};