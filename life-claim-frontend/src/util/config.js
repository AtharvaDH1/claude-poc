// Production: leave API_URL empty — same origin (https://host:3010/api).
// Dev with Vite proxy: also empty; vite.config.js proxies /api to backend.
export const API_URL = import.meta.env.VITE_API_URL || ''

export const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081'
