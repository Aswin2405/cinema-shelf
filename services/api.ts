import { Movie, SubMovie } from "@/constants/data";

// Deployed backend. To run against a local server instead, set
// EXPO_PUBLIC_API_URL in frontend/.env (see .env.example) and restart the dev
// server — Expo inlines EXPO_PUBLIC_* vars at build time, so it is not picked
// up by a fast refresh.
const DEFAULT_API_URL = "https://cinema-shelf-backend.onrender.com";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

export interface ApiPrefs {
  enabled: boolean;
  onAdd: boolean;
  onWatch: boolean;
  dailyReminder: boolean;
  reminderHour: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || res.statusText) as any;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // ── Movies ──────────────────────────────────────────────────────────────────
  getMovies: (): Promise<Movie[]> =>
    request<Movie[]>("/api/movies"),

  createMovie: (movie: Movie): Promise<Movie> =>
    request<Movie>("/api/movies", {
      method: "POST",
      body: JSON.stringify(movie),
    }),

  deleteMovie: (id: string): Promise<{ message: string; movie: Movie }> =>
    request(`/api/movies/${id}`, { method: "DELETE" }),

  patchMovie: (id: string, updates: Partial<Movie>): Promise<Movie> =>
    request<Movie>(`/api/movies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  markWatched: (id: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${id}/watched`, { method: "PATCH" }),

  unmarkWatched: (id: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${id}/unwatched`, { method: "PATCH" }),

  markWatching: (id: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${id}/watching`, { method: "PATCH" }),

  unmarkWatching: (id: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${id}/unwatching`, { method: "PATCH" }),

  // ── Sub-movies ───────────────────────────────────────────────────────────────
  addSubMovie: (movieId: string, sub: SubMovie): Promise<Movie> =>
    request<Movie>(`/api/movies/${movieId}/submovies`, {
      method: "POST",
      body: JSON.stringify(sub),
    }),

  removeSubMovie: (movieId: string, subId: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${movieId}/submovies/${subId}`, {
      method: "DELETE",
    }),

  updateSubMovie: (
    movieId: string,
    subId: string,
    updates: { title?: string; notes?: string }
  ): Promise<Movie> =>
    request<Movie>(`/api/movies/${movieId}/submovies/${subId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  toggleSubMovie: (movieId: string, subId: string): Promise<Movie> =>
    request<Movie>(`/api/movies/${movieId}/submovies/${subId}/toggle`, {
      method: "PATCH",
    }),

  // ── Preferences ──────────────────────────────────────────────────────────────
  getPrefs: (): Promise<ApiPrefs> =>
    request<ApiPrefs>("/api/preferences"),

  patchPrefs: (updates: Partial<ApiPrefs>): Promise<ApiPrefs> =>
    request<ApiPrefs>("/api/preferences", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
};
