import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Movie, SubMovie } from "@/constants/data";
import { getCategoryPosterColor } from "@/constants/categoryColors";
import {
  notifyMovieAdded,
  notifyMovieWatched,
  notifySeriesCompleted,
} from "@/services/notifications";
const STORAGE_TO_WATCH = "@watchlist/toWatch";
const STORAGE_WATCHED = "@watchlist/watched";
const STORAGE_SEEDED = "@watchlist/seeded_v5";

function migrate(raw: any[]): Movie[] {
  return raw.map((m) => ({
    ...m,
    category: m.category || (m as any).genre || "General",
    watchOn: m.watchOn ?? "",
    notes: m.notes ?? "",
  }));
}

interface WatchlistContextType {
  toWatch: Movie[];
  watched: Movie[];
  loading: boolean;
  updateMoviePoster: (id: string, url: string) => void;
  addMovie: (movie: Movie) => void;
  removeMovie: (id: string) => void;
  markWatched: (id: string) => void;
  unmarkWatched: (id: string) => void;
  markCurrentlyWatching: (id: string) => void;
  unmarkCurrentlyWatching: (id: string) => void;
  undoRemove: () => void;
  lastRemoved: Movie | null;
  isInWatchlist: (id: string) => boolean;
  updateMovie: (
    id: string,
    updates: Partial<Pick<Movie, "title" | "category" | "notes" | "watchOn" | "language">>
  ) => void;
  addSubMovie: (movieId: string, sub: SubMovie) => void;
  removeSubMovie: (movieId: string, subId: string) => void;
  toggleSubMovieWatched: (movieId: string, subId: string) => void;
  updateSubMovie: (movieId: string, subId: string, title: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

function patch(movies: Movie[], id: string, fn: (m: Movie) => Movie): Movie[] {
  return movies.map((m) => (m.id === id ? fn(m) : m));
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [toWatch, setToWatch] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);
  const [lastRemoved, setLastRemoved] = useState<Movie | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const [tw, w, seeded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_TO_WATCH),
        AsyncStorage.getItem(STORAGE_WATCHED),
        AsyncStorage.getItem(STORAGE_SEEDED),
      ]);
      if (cancelled) return;

      let toWatchData: Movie[] = tw ? migrate(JSON.parse(tw)) : [];
      let watchedData: Movie[] = w ? migrate(JSON.parse(w)) : [];

      if (!seeded) {
        const { SEED_MOVIES } = await import("@/constants/seedData");
        if (cancelled) return;
        const existingIds = new Set([...toWatchData, ...watchedData].map((m) => m.id));
        const fresh = SEED_MOVIES.filter((m) => !existingIds.has(m.id));
        toWatchData = [...fresh, ...toWatchData];
        const snapshot = toWatchData;
        setTimeout(() => {
          AsyncStorage.setItem(STORAGE_TO_WATCH, JSON.stringify(snapshot)).catch(() => {});
          AsyncStorage.setItem(STORAGE_SEEDED, "1").catch(() => {});
        }, 0);
      }

      setToWatch(toWatchData);
      setWatched(watchedData);
      setLoaded(true);
    };
    init().catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_TO_WATCH, JSON.stringify(toWatch)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [toWatch, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_WATCHED, JSON.stringify(watched)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [watched, loaded]);

  const updateMoviePoster = useCallback((id: string, url: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, posterUrl: url })));
    setWatched((prev) => patch(prev, id, (m) => ({ ...m, posterUrl: url })));
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    setToWatch((prev) => {
      if (prev.find((m) => m.id === movie.id)) return prev;
      notifyMovieAdded(movie.title);
      return [{ ...movie, watched: false }, ...prev];
    });
  }, []);

  const removeMovie = useCallback((id: string) => {
    setToWatch((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (movie) setLastRemoved(movie);
      return prev.filter((m) => m.id !== id);
    });
    setWatched((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const markWatched = useCallback((id: string) => {
    setToWatch((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (!movie) return prev;
      notifyMovieWatched(movie.title);
      setWatched((w) => [{ ...movie, watched: true }, ...w]);
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const unmarkWatched = useCallback((id: string) => {
    setWatched((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (!movie) return prev;
      setToWatch((w) => [{ ...movie, watched: false }, ...w]);
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const markCurrentlyWatching = useCallback((id: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, currentlyWatching: true })));
  }, []);

  const unmarkCurrentlyWatching = useCallback((id: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, currentlyWatching: false })));
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setToWatch((prev) => [lastRemoved, ...prev]);
    setLastRemoved(null);
  }, [lastRemoved]);

  const isInWatchlist = useCallback(
    (id: string) =>
      toWatch.some((m) => m.id === id) || watched.some((m) => m.id === id),
    [toWatch, watched]
  );

  const updateMovie = useCallback(
    (
      id: string,
      updates: Partial<Pick<Movie, "title" | "category" | "notes" | "watchOn" | "language">>
    ) => {
      const apply = (prev: Movie[]) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const next = { ...m, ...updates };
          if (updates.category && updates.category !== m.category) {
            next.posterColor = getCategoryPosterColor(updates.category);
          }
          return next;
        });
      setToWatch(apply);
      setWatched(apply);
    },
    []
  );

  const addSubMovie = useCallback((movieId: string, sub: SubMovie) => {
    const update = (m: Movie): Movie => ({
      ...m,
      subMovies: [...(m.subMovies ?? []), sub],
    });
    setToWatch((prev) => patch(prev, movieId, update));
    setWatched((prev) => patch(prev, movieId, update));
  }, []);

  const removeSubMovie = useCallback((movieId: string, subId: string) => {
    const update = (m: Movie): Movie => ({
      ...m,
      subMovies: (m.subMovies ?? []).filter((s) => s.id !== subId),
    });
    setToWatch((prev) => patch(prev, movieId, update));
    setWatched((prev) => patch(prev, movieId, update));
  }, []);

  const updateSubMovie = useCallback(
    (movieId: string, subId: string, title: string) => {
      const update = (m: Movie): Movie => ({
        ...m,
        subMovies: (m.subMovies ?? []).map((s) =>
          s.id === subId ? { ...s, title } : s
        ),
      });
      setToWatch((prev) => patch(prev, movieId, update));
      setWatched((prev) => patch(prev, movieId, update));
    },
    []
  );

  const toggleSubMovieWatched = useCallback(
    (movieId: string, subId: string) => {
      const applyToggle = (m: Movie): Movie => ({
        ...m,
        subMovies: (m.subMovies ?? []).map((s) =>
          s.id === subId ? { ...s, watched: !s.watched } : s
        ),
      });
      setToWatch((prev) => {
        const movie = prev.find((m) => m.id === movieId);
        if (!movie) return prev;
        const updated = applyToggle(movie);
        const subs = updated.subMovies ?? [];
        const allDone = subs.length > 0 && subs.every((s) => s.watched);
        if (allDone) {
          notifySeriesCompleted(updated.title);
          setWatched((w) => [{ ...updated, watched: true }, ...w]);
          return prev.filter((m) => m.id !== movieId);
        }
        return patch(prev, movieId, applyToggle);
      });
      setWatched((prev) => patch(prev, movieId, applyToggle));
    },
    []
  );

  const value = useMemo<WatchlistContextType>(
    () => ({
      toWatch, watched, loading: !loaded, updateMoviePoster,
      addMovie, removeMovie, markWatched, unmarkWatched,
      markCurrentlyWatching, unmarkCurrentlyWatching, undoRemove, lastRemoved,
      isInWatchlist, updateMovie, addSubMovie, removeSubMovie,
      toggleSubMovieWatched, updateSubMovie,
    }),
    [
      toWatch, watched, loaded, updateMoviePoster,
      addMovie, removeMovie, markWatched, unmarkWatched,
      markCurrentlyWatching, unmarkCurrentlyWatching, undoRemove, lastRemoved,
      isInWatchlist, updateMovie, addSubMovie, removeSubMovie,
      toggleSubMovieWatched, updateSubMovie,
    ]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
