// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// Helper function to get full API URL
export const getApiUrl = (path: string) => {
  // If API_URL is a full URL (starts with http), use it directly
  if (API_URL.startsWith('http')) {
    return `${API_URL}${path}`;
  }
  // If API_URL is a relative path (like /api), use it as is
  // This works for production when API and client are on same domain
  return `${API_URL}${path}`;
};

// Helper function to get WebSocket URL
export const getWebSocketUrl = () => {
  // If WS_URL is a full WebSocket URL (starts with ws), use it directly
  if (WS_URL.startsWith('ws')) {
    return WS_URL;
  }
  // For production with same domain, construct WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
};

