/**
 * Single place for the backend URL.
 * Later (Supabase/sync) we only change this file or .env — not every component.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const productsApi = `${API_BASE}/products`;
export const customersApi = `${API_BASE}/customers`;
export const salesApi = `${API_BASE}/sales`;
export const dashboardApi = `${API_BASE}/dashboard`;
/** Dev: inspect sync queue */
export const outboxApi = `${API_BASE}/outbox`;
export const syncApi = `${API_BASE}/sync`;
export const authApi = `${API_BASE}/auth`;
export const pharmacyApi = `${API_BASE}/pharmacy`;
