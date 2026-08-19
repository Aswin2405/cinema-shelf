import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Movie } from "@/constants/data";
import { getCategoryPosterColor } from "@/constants/categoryColors";
import { LightColors, Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { PosterPicker, usePosterSearch } from "./PosterPicker";

interface AddMovieModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => void;
  existingCategories?: string[];
  existingWatchOn?: string[];
  existingLanguages?: string[];
  existingTitles?: string[];
}

export function AddMovieModal({
  visible,
  onClose,
  onAdd,
  existingCategories = [],
  existingWatchOn = [],
  existingLanguages = [],
  existingTitles = [],
}: AddMovieModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [watchOn, setWatchOn] = useState("");
  const [language, setLanguage] = useState("");
  const [notes, setNotes] = useState("");
  const [dupTitle, setDupTitle] = useState<string | null>(null);

  const [selectedPosterUrl, setSelectedPosterUrl] = useState<string | null>(null);

  // Debounced TMDB search, driven by whatever title has been typed so far
  const { results: posterResults, isSearching } = usePosterSearch(title);

  useEffect(() => {
    if (!dupTitle) return;
    const t = setTimeout(() => setDupTitle(null), 3000);
    return () => clearTimeout(t);
  }, [dupTitle]);

  const reset = useCallback(() => {
    setTitle("");
    setCategory("");
    setWatchOn("");
    setLanguage("");
    setNotes("");
    setSelectedPosterUrl(null);
    setDupTitle(null);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const isDuplicate = existingTitles.some(
      (t) => t.toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (isDuplicate) {
      setDupTitle(trimmedTitle);
      return;
    }

    const cat = category.trim() || "General";
    const movie: Movie = {
      id: Date.now().toString(),
      title: trimmedTitle,
      category: cat,
      watchOn: watchOn.trim(),
      language: language.trim() || undefined,
      notes: notes.trim(),
      rating: 0,
      posterColor: getCategoryPosterColor(cat),
      posterUrl: selectedPosterUrl ?? undefined,
      watched: false,
      dateAdded: new Date().toISOString().split("T")[0],
    };
    onAdd(movie);
    reset();
    onClose();
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient
          colors={["rgba(229,56,59,0.18)", "rgba(217,119,6,0.06)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Add to Watchlist</Text>
            <Text style={styles.headerSubtitle}>Save a film, series, or anime</Text>
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
            disabled={!title.trim()}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Duplicate banner ── */}
          {dupTitle && (
            <View style={[styles.dupBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + "50" }]}>
              <View style={[styles.dupAccent, { backgroundColor: colors.primary }]} />
              <View style={[styles.dupIconWrap, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="bookmark" size={18} color={colors.primary} />
              </View>
              <View style={styles.dupBody}>
                <Text style={[styles.dupTitle, { color: colors.text }]}>Already in Watchlist</Text>
                <Text style={[styles.dupSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  "{dupTitle}" is already saved
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDupTitle(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Title ── */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border }]}
            placeholder="e.g. The Godfather"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* ── TMDB Poster Picker ── */}
          <PosterPicker
            isSearching={isSearching}
            results={posterResults}
            selectedUrl={selectedPosterUrl}
            onSelect={setSelectedPosterUrl}
            titleEntered={title.trim().length >= 2}
          />

          {/* ── Category ── */}
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border }]}
            placeholder="e.g. K-Drama, Anime, Horror..."
            placeholderTextColor={colors.textTertiary}
            value={category}
            onChangeText={setCategory}
            returnKeyType="next"
          />
          {existingCategories.length > 0 && (
            <ChipRow items={existingCategories} selected={category} onSelect={setCategory} colors={colors} />
          )}

          {/* ── Where to Watch ── */}
          <Text style={styles.label}>Where to Watch</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border }]}
            placeholder="e.g. Netflix, Prime Video, MovieBox..."
            placeholderTextColor={colors.textTertiary}
            value={watchOn}
            onChangeText={setWatchOn}
            returnKeyType="next"
          />
          {existingWatchOn.length > 0 && (
            <ChipRow items={existingWatchOn} selected={watchOn} onSelect={setWatchOn} colors={colors} />
          )}

          {/* ── Language ── */}
          <Text style={styles.label}>Language</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border }]}
            placeholder="e.g. Tamil, English, Korean..."
            placeholderTextColor={colors.textTertiary}
            value={language}
            onChangeText={setLanguage}
            returnKeyType="next"
          />
          {existingLanguages.length > 0 && (
            <ChipRow items={existingLanguages} selected={language} onSelect={setLanguage} colors={colors} />
          )}

          {/* ── Notes ── */}
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { borderColor: colors.border }]}
            placeholder="Any notes, reminders, thoughts..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Chip row ──────────────────────────────────────────────────────────────────

function ChipRow({
  items, selected, onSelect, colors,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  colors: typeof LightColors;
}) {
  return (
    <View style={chipStyles.row}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          onPress={() => onSelect(selected === item ? "" : item)}
          style={[
            chipStyles.chip,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            selected === item && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[chipStyles.chipText, { color: selected === item ? "#fff" : colors.textSecondary }]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1.5 },
  chipText: { fontSize: Typography.size.sm, fontWeight: "600" },
});

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      borderBottomWidth: 1,
    },
    headerCopy: { flex: 1, paddingHorizontal: Spacing.md },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: Typography.size.md, fontWeight: "800", color: colors.text },
    headerSubtitle: { color: colors.textSecondary, fontSize: Typography.size.xs, fontWeight: "600", marginTop: 2 },
    addBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.full,
    },
    addBtnDisabled: { opacity: 0.4 },
    addBtnText: { color: "#fff", fontSize: Typography.size.base, fontWeight: "700" },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.base, paddingBottom: 60, gap: Spacing.xs },

    // Duplicate banner
    dupBanner: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: Radius.lg,
      borderWidth: 1,
      overflow: "hidden",
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      paddingRight: Spacing.base,
      marginBottom: Spacing.xs,
    },
    dupAccent: { width: 4, alignSelf: "stretch" },
    dupIconWrap: {
      width: 34, height: 34, borderRadius: Radius.md,
      alignItems: "center", justifyContent: "center",
    },
    dupBody: { flex: 1, gap: 2 },
    dupTitle: { fontSize: Typography.size.base, fontWeight: "700" },
    dupSub: { fontSize: Typography.size.sm, fontWeight: "500" },

    label: {
      fontSize: Typography.size.sm, fontWeight: "600", color: colors.textSecondary,
      marginTop: Spacing.md, marginBottom: Spacing.xs,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.size.base,
      color: colors.text,
      borderWidth: 1,
      ...Shadow.sm,
    },
    notesInput: { minHeight: 100, paddingTop: Spacing.md },
  });
}
