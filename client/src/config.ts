// API Base URL (from environment or fallback)
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// WebSocket Base URL
export const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:3000";

// Build full API path
export const getApiUrl = (path: string) => {
  return `${API_URL}${path}`;
};

// Build WebSocket URL
export const getWebSocketUrl = () => {
  if (WS_URL.startsWith("ws")) return WS_URL;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}`;
};