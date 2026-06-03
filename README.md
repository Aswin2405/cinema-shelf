# Cinema Shelf

A personal movie and series watchlist app built with React Native and Expo. Track what you want to watch, what you're currently watching, and what you've already finished — all in one polished, offline-first app.

---

## Features

### Core Watchlist
- Add movies and series to your watchlist with category, platform, language, rating, and notes
- Mark items as **watched**, **currently watching**, or remove them with an **undo snackbar**
- **Series support** — add sub-parts (e.g. Part 1, Part 2) to any entry; when all parts are marked watched the whole series auto-completes
- Edit any movie's details after adding it

### Home Screen
- **Featured hero** — the first unwatched movie displayed as a large cinematic banner
- **Continue Watching** — horizontal carousel of in-progress titles
- **3-column grid** of all movies with watched/playing status badges
- **Filter chips** for category, streaming platform, and language — chain multiple filters together
- Skeleton loading screen while data initialises

### Search
- Search tab powered by the TMDB API for discovering movies and adding them directly

### TMDB Poster Auto-Fetch
- Posters are lazily fetched from [The Movie Database](https://www.themoviedb.org/) as cards scroll into view — no manual image upload needed
- Falls back to a colour-coded poster generated from the movie's category when no poster is available

### Biometric Lock
- Optional app lock using Face ID / Touch ID (via `expo-local-authentication`)
- Shows a lock screen on app launch when enabled; unlocks instantly on successful biometric auth

### Push Notifications
- Instant notification when a movie is added to your watchlist
- Instant notification when you mark a movie as watched
- Celebration notification when all parts of a series are completed
- Optional **daily reminder** at a configurable hour to pick something to watch

### Theming
- Light and dark mode with a single tap — adapts to system preference by default
- Frosted glass floating tab bar with platform-native blur (iOS) and elevation (Android)

### Offline-First
- All data is persisted locally with AsyncStorage — works with no internet connection
- TMDB poster fetches are a progressive enhancement; the app is fully functional without them

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo ~54 |
| Language | TypeScript 5.9 |
| Routing | Expo Router (file-based) |
| State | React Context + `useWatchlist` hook |
| Storage | AsyncStorage |
| Animation | React Native Reanimated 4 |
| UI | Expo Blur, Expo Linear Gradient, Expo Haptics, Expo Image |
| Auth | expo-local-authentication |
| Notifications | expo-notifications |
| External API | TMDB (The Movie Database) |
| Build | EAS Build |

React Compiler and the New Architecture are both enabled.

---

## Project Structure

```
app/
  _layout.tsx           — Root layout, providers, lock screen gate
  (tabs)/
    _layout.tsx         — Floating glass pill tab bar
    index.tsx           — Home screen (hero, continue watching, grid, filters)
    search.tsx          — Search screen
    watchlist.tsx       — Watchlist screen
    profile.tsx         — Profile / settings screen
    add.tsx             — Add movie entry point

components/
  AddMovieModal.tsx     — Bottom sheet for adding a new movie
  MovieDetailModal.tsx  — Full-screen detail view for a single movie
  MovieCard.tsx         — Card used in list views
  MoviePoster.tsx       — Poster image with colour fallback
  GenreBadge.tsx        — Colour-coded category chip
  LockScreen.tsx        — Biometric lock overlay
  SkeletonBox.tsx       — Animated placeholder for loading states
  UndoSnackbar.tsx      — Temporary snackbar for undo-delete
  DatabaseProvider.tsx  — Wraps WatchlistProvider for the component tree

constants/
  data.ts               — Movie and SubMovie TypeScript interfaces
  theme.ts              — Colours, typography, spacing, radius, shadow tokens
  categoryColors.ts     — Per-category poster colour map
  seedData.ts           — Pre-loaded sample movies for first launch

context/
  ThemeContext.tsx       — Light / dark theme toggle
  LockContext.tsx        — Biometric lock state and unlock logic
  ModalContext.tsx       — Global add-movie modal open/close

hooks/
  useWatchlist.tsx       — All watchlist CRUD logic + AsyncStorage persistence

services/
  tmdb.ts               — TMDB search and poster URL helpers
  notifications.ts      — Push notification scheduling and preferences
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. (Optional) Configure TMDB for poster images

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/settings/api) and generate an API key.
2. Open [services/tmdb.ts](services/tmdb.ts) and replace the `TMDB_API_KEY` value with your key.

The app works without this step — movies just display colour-coded poster placeholders instead of real images.

### 3. Start the development server

```bash
npx expo start
```

Then open in your preferred target:

- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`
- **Physical device** — scan the QR code with Expo Go
- **Development build** (recommended for biometrics and notifications) — `npx expo run:ios` or `npx expo run:android`

> Biometric authentication and push notifications require a development build or production build — they do not work in Expo Go.

---

## Building for Production

This project is configured for [EAS Build](https://docs.expo.dev/build/introduction/).

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Key Decisions

- **Lazy-loaded modals** — `MovieDetailModal` is code-split with `React.lazy` so the heavy modal bundle is only downloaded when a user taps a movie.
- **Viewability-driven poster fetches** — TMDB is only called for movies that are actually visible on screen, not the full list up front.
- **Debounced AsyncStorage writes** — saves are batched with a 300 ms debounce to avoid thrashing storage on rapid state changes.
- **Series auto-completion** — when every sub-part of a series is checked off, the parent is atomically moved to the watched list and a notification fires.
