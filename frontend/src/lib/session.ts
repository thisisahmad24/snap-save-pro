export type StoredUser = {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  country?: string;
  avatar_url?: string;
  is_pro?: boolean;
  plan?: string;
};

const TOKEN_KEY = "snap_token";
const USER_KEY = "snap_user";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as StoredUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authHeaders() {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function extractStoredUserId() {
  return getStoredUser()?.id || null;
}
