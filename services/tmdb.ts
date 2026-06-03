// ─────────────────────────────────────────────────────────────────────────────
// TMDB (The Movie Database) service
// Get your free API key at: https://www.themoviedb.org/settings/api
// Replace the string below with your key, then restart the dev server.
// ─────────────────────────────────────────────────────────────────────────────
const TMDB_API_KEY: string = "d77f70de4830809e884873988bbae61c";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export interface TmdbResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

/** Full-size poster URL for storing on the movie (w500 = ~500px wide). */
export function fullPosterUrl(path: string): string {
  return `${IMG}/w500${path}`;
}

/** Thumbnail URL for the picker UI (w92 = 92px wide, tiny payload). */
export function thumbPosterUrl(path: string): string {
  return `${IMG}/w92${path}`;
}

/** Returns true when the API key has been set. */
export function isTmdbConfigured(): boolean {
  const configured = TMDB_API_KEY !== "YOUR_TMDB_API_KEY_HERE" && TMDB_API_KEY.length > 10;
  console.log("[TMDB] isTmdbConfigured:", configured, "| key:", TMDB_API_KEY.slice(0, 6) + "...");
  return configured;
}

/**
 * Search TMDB for movies matching `query`.
 * Returns only results that have a poster image.
 * Returns [] silently if the key is not configured or the request fails.
 */
export async function searchMovies(query: string): Promise<TmdbResult[]> {
  console.log("[TMDB] searchMovies called | query:", query);

  if (!query.trim()) {
    console.log("[TMDB] Skipped — empty query");
    return [];
  }
  if (!isTmdbConfigured()) {
    console.log("[TMDB] Skipped — API key not configured");
    return [];
  }

  const url =
    `${BASE}/search/movie` +
    `?api_key=${TMDB_API_KEY}` +
    `&query=${encodeURIComponent(query.trim())}` +
    `&include_adult=false&language=en-US&page=1`;

  console.log("[TMDB] Fetching:", url.replace(TMDB_API_KEY, "***"));

  try {
    const res = await fetch(url);
    console.log("[TMDB] Response status:", res.status);

    if (!res.ok) {
      console.warn("[TMDB] Request failed:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    const withPosters = (data.results as TmdbResult[]).filter((r) => r.poster_path);
    console.log("[TMDB] Total results:", data.results?.length, "| With posters:", withPosters.length);
    return withPosters;
  } catch (err) {
    console.error("[TMDB] Fetch error:", err);
    return [];
  }
}
