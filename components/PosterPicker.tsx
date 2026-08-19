import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LightColors, Typography, Spacing, Radius } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import {
  searchMovies,
  fullPosterUrl,
  thumbPosterUrl,
  isTmdbConfigured,
  TmdbResult,
} from "@/services/tmdb";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 600;
const MAX_RESULTS = 10;

/**
 * Debounced TMDB poster search, shared by the add and edit flows so both behave
 * identically. Stays idle until `enabled`, so opening a movie without editing it
 * makes no network calls.
 */
export function usePosterSearch(query: string, enabled: boolean = true) {
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < MIN_QUERY_LENGTH || !isTmdbConfigured()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await searchMovies(q);
      // Guard against a slow response landing after the query moved on
      if (cancelled) return;
      setResults(found.slice(0, MAX_RESULTS));
      setIsSearching(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, isSearching };
}

interface PosterPickerProps {
  results: TmdbResult[];
  isSearching: boolean;
  /** Currently chosen poster, or null for none. */
  selectedUrl: string | null;
  /** Called with the tapped poster, or null when the selection is undone. */
  onSelect: (url: string | null) => void;
  /** Hidden until the title is long enough to search on. */
  titleEntered: boolean;
  label?: string;
  clearLabel?: string;
  /** Whether the undo button shows. Defaults to "a poster is selected". */
  canClear?: boolean;
}

export function PosterPicker({
  results,
  isSearching,
  selectedUrl,
  onSelect,
  titleEntered,
  label,
  clearLabel = "Clear",
  canClear,
}: PosterPickerProps) {
  const { colors } = useTheme();

  if (!isTmdbConfigured()) return null;
  if (!titleEntered) return null;

  const styles = makeStyles(colors);
  const showClear = canClear ?? Boolean(selectedUrl);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="image-outline" size={14} color={colors.primary} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label ?? (selectedUrl ? "Poster selected" : "Choose a poster")}
        </Text>
        {showClear && (
          <TouchableOpacity
            onPress={() => onSelect(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clear, { color: colors.textTertiary }]}>{clearLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>Searching TMDB…</Text>
        </View>
      ) : results.length === 0 ? (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>No posters found</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {results.map((r) => {
            const full = fullPosterUrl(r.poster_path!);
            const thumb = thumbPosterUrl(r.poster_path!);
            const isSelected = selectedUrl === full;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => onSelect(isSelected ? null : full)}
                style={[
                  styles.thumbWrap,
                  isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                ]}
                activeOpacity={0.8}
              >
                <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
                {isSelected && (
                  <View style={styles.thumbCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
                <Text style={[styles.thumbYear, { color: colors.textTertiary }]} numberOfLines={1}>
                  {r.release_date?.slice(0, 4) ?? ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    section: {
      marginTop: Spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.lg,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.xs,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 5 },
    label: { fontSize: Typography.size.sm, fontWeight: "600", flex: 1 },
    clear: { fontSize: Typography.size.sm, fontWeight: "600" },
    loading: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    hint: { fontSize: Typography.size.sm, paddingVertical: Spacing.xs },
    scroll: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    thumbWrap: {
      width: 70,
      borderRadius: Radius.md,
      overflow: "hidden",
      borderWidth: 0,
      borderColor: "transparent",
    },
    thumb: { width: 70, height: 100, borderRadius: Radius.md },
    thumbCheck: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#fff",
      borderRadius: 10,
    },
    thumbYear: { fontSize: 10, fontWeight: "600", textAlign: "center", marginTop: 3 },
  });
}
