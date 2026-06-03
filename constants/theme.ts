export const LightColors = {
  primary: "#E5383B",
  primaryLight: "#FF6B6E",
  primaryDark: "#B71C1E",
  primaryMuted: "rgba(229,56,59,0.12)",

  background: "#F0F2F8",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  text: "#0D0F18",
  textSecondary: "#5A5F72",
  textTertiary: "#9095A8",
  textInverse: "#FFFFFF",

  border: "#E2E5EF",
  borderLight: "#ECEEF6",

  success: "#22C55E",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  error: "#EF4444",

  genreSci: { bg: "#EDE9FF", text: "#6B4EFF" },
  genreAction: { bg: "#FFF3E0", text: "#E65100" },
  genreDrama: { bg: "#E8F5E9", text: "#2E7D32" },
  genreCrime: { bg: "#FCE4EC", text: "#C62828" },
  genreHorror: { bg: "#F3E5F5", text: "#6A1B9A" },
  genreComedy: { bg: "#E3F2FD", text: "#1565C0" },
  genreRomance: { bg: "#FCE4EC", text: "#AD1457" },
  genreDefault: { bg: "#F5F5F5", text: "#424242" },
};

export const DarkColors = {
  primary: "#E5383B",
  primaryLight: "#FF6B6E",
  primaryDark: "#B71C1E",
  primaryMuted: "rgba(229,56,59,0.15)",

  // True streaming-app dark
  background: "#090A0F",
  surface: "#111318",
  surfaceElevated: "#181B25",

  text: "#F1F3F8",
  textSecondary: "#8E95A9",
  textTertiary: "#555C72",
  textInverse: "#0D0F18",

  border: "#1F2232",
  borderLight: "#171A27",

  success: "#22C55E",
  successLight: "#052E16",
  warning: "#F59E0B",
  error: "#EF4444",

  genreSci: { bg: "#1E1A3A", text: "#8B71FF" },
  genreAction: { bg: "#2A1400", text: "#FB923C" },
  genreDrama: { bg: "#0A2010", text: "#4ADE80" },
  genreCrime: { bg: "#2A0A0A", text: "#F87171" },
  genreHorror: { bg: "#1A0A2A", text: "#C084FC" },
  genreComedy: { bg: "#0A1A2A", text: "#60A5FA" },
  genreRomance: { bg: "#2A0A15", text: "#F472B6" },
  genreDefault: { bg: "#14161F", text: "#8E95A9" },
};

export const Colors = LightColors;

export const Typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    "2xl": 28,
    "3xl": 34,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: "#E5383B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
