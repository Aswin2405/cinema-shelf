import { Movie, SubMovie } from "@/constants/data";

// Change this to your machine's IP when testing on a physical device
// e.g. 'http://192.168.1.x:3001'
export const API_BASE_URL = "http://localhost:3001";

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
