export interface SubMovie {
  id: string;
  title: string;
  notes: string;
  watched: boolean;
  dateAdded: string;
}

export interface Movie {
  id: string;
  title: string;
  category: string;
  watchOn: string;
  language?: string;
  notes: string;
  rating: number;
  watched: boolean;
  currentlyWatching?: boolean;
  dateAdded: string;
  posterColor: string;
  posterUrl?: string;        // TMDB poster image URL (w500), optional
  subMovies?: SubMovie[];
  // Optional legacy fields
  posterEmoji?: string;
  year?: number;
  duration?: string;
  description?: string;
  director?: string;
}
