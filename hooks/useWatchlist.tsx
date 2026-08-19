import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { Movie, SubMovie } from "@/constants/data";
import { getCategoryPosterColor } from "@/constants/categoryColors";
import {
  notifyMovieAdded,
  notifyMovieWatched,
  notifySeriesCompleted,
} from "@/services/notifications";
import { api } from "@/services/api";

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
    updates: Partial<
      Pick<Movie, "title" | "category" | "notes" | "watchOn" | "language" | "posterUrl">
    >
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

    // Free-tier hosts spin the backend down when idle — a cold start can take
    // 30-60s. If the first request hasn't resolved shortly, tell the user why.
    const wakeupTimer = setTimeout(() => {
      if (!cancelled) {
        Alert.alert(
          "Loading app",
          "Please wait a moment — the server is waking up. This can take up to a minute."
        );
      }
    }, 2500);

    const init = async () => {
      const backendMovies = await api.getMovies();
      if (cancelled) return;
      setToWatch(backendMovies.filter((m) => !m.watched));
      setWatched(backendMovies.filter((m) => m.watched));
    };

    init()
      .catch(() => {
        // Backend unreachable — leave lists empty until it's back
      })
      .finally(() => {
        clearTimeout(wakeupTimer);
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; clearTimeout(wakeupTimer); };
  }, []);

  // ── Mutations: optimistic local update + background API sync ─────────────────

  const updateMoviePoster = useCallback((id: string, url: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, posterUrl: url })));
    setWatched((prev) => patch(prev, id, (m) => ({ ...m, posterUrl: url })));
    api.patchMovie(id, { posterUrl: url }).catch(() => {});
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    setToWatch((prev) => {
      if (prev.find((m) => m.id === movie.id)) return prev;
      notifyMovieAdded(movie.title);
      return [{ ...movie, watched: false }, ...prev];
    });
    api.createMovie({ ...movie, watched: false }).catch(() => {});
  }, []);

  const removeMovie = useCallback((id: string) => {
    setToWatch((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (movie) setLastRemoved(movie);
      return prev.filter((m) => m.id !== id);
    });
    setWatched((prev) => prev.filter((m) => m.id !== id));
    api.deleteMovie(id).catch(() => {});
  }, []);

  const markWatched = useCallback((id: string) => {
    setToWatch((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (!movie) return prev;
      notifyMovieWatched(movie.title);
      setWatched((w) => [{ ...movie, watched: true }, ...w]);
      return prev.filter((m) => m.id !== id);
    });
    api.markWatched(id).catch(() => {});
  }, []);

  const unmarkWatched = useCallback((id: string) => {
    setWatched((prev) => {
      const movie = prev.find((m) => m.id === id);
      if (!movie) return prev;
      setToWatch((w) => [{ ...movie, watched: false }, ...w]);
      return prev.filter((m) => m.id !== id);
    });
    api.unmarkWatched(id).catch(() => {});
  }, []);

  const markCurrentlyWatching = useCallback((id: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, currentlyWatching: true })));
    api.markWatching(id).catch(() => {});
  }, []);

  const unmarkCurrentlyWatching = useCallback((id: string) => {
    setToWatch((prev) => patch(prev, id, (m) => ({ ...m, currentlyWatching: false })));
    api.unmarkWatching(id).catch(() => {});
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setToWatch((prev) => [lastRemoved, ...prev]);
    api.createMovie(lastRemoved).catch(() => {});
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
      updates: Partial<
        Pick<Movie, "title" | "category" | "notes" | "watchOn" | "language" | "posterUrl">
      >
    ) => {
      // Compute posterColor eagerly so both state and API receive the same value
      const patchData: Partial<Movie> = { ...updates };
      if (updates.category) {
        patchData.posterColor = getCategoryPosterColor(updates.category);
      }
      const apply = (prev: Movie[]) =>
        prev.map((m) => (m.id !== id ? m : { ...m, ...patchData }));
      setToWatch(apply);
      setWatched(apply);
      api.patchMovie(id, patchData).catch(() => {});
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
    api.addSubMovie(movieId, sub).catch(() => {});
  }, []);

  const removeSubMovie = useCallback((movieId: string, subId: string) => {
    const update = (m: Movie): Movie => ({
      ...m,
      subMovies: (m.subMovies ?? []).filter((s) => s.id !== subId),
    });
    setToWatch((prev) => patch(prev, movieId, update));
    setWatched((prev) => patch(prev, movieId, update));
    api.removeSubMovie(movieId, subId).catch(() => {});
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
      api.updateSubMovie(movieId, subId, { title }).catch(() => {});
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
      api.toggleSubMovie(movieId, subId).catch(() => {});
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
