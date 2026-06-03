const POSTER_COLORS = [
  "#1a1a2e",
  "#0d1b2a",
  "#1c1c1c",
  "#2c1810",
  "#6B0000",
  "#1a0a00",
  "#1d3a22",
  "#0a3a4a",
  "#2a1a4a",
  "#3a1a1a",
  "#0a2a2a",
  "#2a0a2a",
  "#1a2a0a",
  "#2a1a0a",
  "#0a1a3a",
  "#3a2a0a",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h * 31) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCategoryPosterColor(category: string): string {
  return POSTER_COLORS[hash(category) % POSTER_COLORS.length];
}
