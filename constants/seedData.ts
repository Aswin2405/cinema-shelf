import { Movie } from "./data";
// Explicit poster colours for seeds that need a unique look
const COLORS: Record<number, string> = {
  // Anime
  0:"#1a0a2e",1:"#0a1a2e",2:"#1a2e0a",3:"#2e0a0a",4:"#0a2e1a",
  5:"#1a1a0a",6:"#2e1a0a",7:"#0a2e2e",8:"#2e0a1a",9:"#1a0a1a",
  10:"#2e1a1a",11:"#0a0a2e",12:"#1a2a0a",13:"#0a1a1a",14:"#2a0a2e",15:"#0a2a1a",
  // Korean
  16:"#2e0a1e",17:"#0e1a2e",18:"#0a2a2e",19:"#2e180a",20:"#1e0a0a",
  21:"#0a2e18",22:"#1a0a0e",23:"#0a0a1e",24:"#1e1a0a",25:"#2a1a2e",
  26:"#0a1e0e",27:"#1e0a2e",
  // Horror
  28:"#1a0000",29:"#0a0a0a",30:"#1a0800",31:"#0a001a",32:"#200000",
  // Series
  33:"#1a1e2e",34:"#1e1a0a",35:"#0a1e1a",36:"#1e0a0a",37:"#0a0a1e",
  38:"#1a0e1e",39:"#1e0a0e",40:"#0e1e0a",41:"#1e1a1e",42:"#0a1a1e",
  43:"#1e1e0a",44:"#0e0a1e",45:"#1e0e0a",46:"#0e1e1a",47:"#1a0a1e",
  48:"#1e1a0e",49:"#0a1e0a",50:"#1e0e1a",51:"#0a0e1e",52:"#1e0a1e",
  53:"#0e1a0e",54:"#1e1e1a",55:"#0a1e1e",56:"#1a1e0a",57:"#0e0e1e",
  58:"#1e0e0e",59:"#0a0e0a",60:"#1a0e0e",61:"#0e1a1e",62:"#1e0a1a",
  63:"#0e1e0e",64:"#1a1a1e",
};

// Auto-colour palette for movies (cycles by title hash → always consistent)
const MOVIE_PALETTE = [
  "#1a1e2e","#1e1a0a","#0a1e1a","#1e0a0a","#0a0a1e","#1a0e1e",
  "#1e0a0e","#0e1e0a","#1e1a1e","#0a1a1e","#1e1e0a","#0e0a1e",
  "#1e0e0a","#0e1e1a","#1a0a1e","#1e1a0e","#0a1e0a","#1e0e1a",
  "#0a0e1e","#1e0a1e","#0e1a0e","#2a0a1a","#0a2a1e","#1a2a0e",
];

function titleHash(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = ((h * 31) + title.charCodeAt(i)) >>> 0;
  return h;
}

const TODAY = new Date().toISOString().split("T")[0];

function make(
  index: number,
  title: string,
  category: string,
  watchOn: string,
  notes = "",
  subMovies?: { title: string }[]
): Movie {
  const posterColor =
    COLORS[index] ?? MOVIE_PALETTE[titleHash(title) % MOVIE_PALETTE.length];
  return {
    id: `seed_${index}`,
    title,
    category,
    watchOn,
    notes,
    rating: 0,
    watched: false,
    dateAdded: TODAY,
    posterColor,
    subMovies: subMovies?.map((s, si) => ({
      id: `seed_${index}_s${si}`,
      title: s.title,
      notes: "",
      watched: false,
      dateAdded: TODAY,
    })),
  };
}

// Helpers
const A = (i: number, t: string, n = "", s?: {title:string}[]) =>
  make(i, t, "Anime Series",  "MovieBox", n, s);
const K = (i: number, t: string, n = "", s?: {title:string}[]) =>
  make(i, t, "Korean Series", "MovieBox", n, s);
const H = (i: number, t: string, n = "") =>
  make(i, t, "Horror Movies", "MovieBox", n);
const S = (i: number, t: string, n = "") =>
  make(i, t, "Series",        "MovieBox", n);
const MBox = (i: number, t: string, n = "", s?: {title:string}[]) =>
  make(i, t, "Movies", "MovieBox", n, s);
const MYT = (i: number, t: string, n = "") =>
  make(i, t, "Movies", "YouTube",  n);

export const SEED_MOVIES: Movie[] = [
  // ── Anime Series ────────────────────────────────────────────────────────
  A(0,  "Bleach"),
  A(1,  "Fullmetal Alchemist: Brotherhood"),
  A(2,  "Hunter x Hunter"),
  A(3,  "Attack on Titan"),
  A(4,  "Naruto"),
  A(5,  "Naruto Shippuden"),
  A(6,  "Boruto"),
  A(7,  "One Piece"),
  A(8,  "Jujutsu Kaisen"),
  A(9,  "Demon Slayer"),
  A(10, "Chainsaw Man", "Movie watch!"),
  A(11, "Death Note"),
  A(12, "Dragon Ball Z"),
  A(13, "Pokémon"),
  A(14, "One Punch Man"),
  A(15, "My Hero Academia"),

  // ── Korean Series ────────────────────────────────────────────────────────
  K(16, "Strong Woman Do Bong Soon"),
  K(17, "Goblin"),
  K(18, "The Legend of the Blue Sea"),
  K(19, "Business Proposal"),
  K(20, "All of Us Are Dead"),
  K(21, "What's Wrong with Secretary Kim"),
  K(22, "Flower of Evil"),
  K(23, "Twenty-Five Twenty-One"),
  K(24, "It's Okay to Not Be Okay"),
  K(25, "Welcome to Waikiki", "", [{ title: "Part 1" }, { title: "Part 2" }]),
  K(26, "Vincenzo"),
  K(27, "Death Note"),

  // ── Horror Movies ────────────────────────────────────────────────────────
  H(28, "The Exorcist"),
  H(29, "Conjuring"),
  H(30, "Sinister"),
  H(31, "Insidious"),
  H(32, "Annabelle"),

  // ── Series ───────────────────────────────────────────────────────────────
  S(33, "Friends"),
  S(34, "Game of Thrones"),
  S(35, "The Office (US)"),
  S(36, "Prison Break"),
  S(37, "Dark"),
  S(38, "Wednesday"),
  S(39, "The Boys"),
  S(40, "The Summer I Turned Pretty"),
  S(41, "From"),
  S(42, "Person of Interest"),
  S(43, "1899"),
  S(44, "Stranger Things"),
  S(45, "Alice in Borderland"),
  S(46, "Narcos"),
  S(47, "Peaky Blinders"),
  S(48, "Breaking Bad"),
  S(49, "All of Us Are Dead"),
  S(50, "The Witcher"),
  S(51, "The Big Bang Theory"),
  S(52, "The Walking Dead"),
  S(53, "Vikings"),
  S(54, "Sex Education"),
  S(55, "Epstein Files"),
  S(56, "Loki"),
  S(57, "Gen V"),
  S(58, "House of the Dragon"),
  S(59, "Hitler and the Nazis: Evil on Trial"),
  S(60, "The Railway Men"),
  S(61, "From the Earth to the Moon"),
  S(62, "A Knight of Seven Kingdoms"),
  S(63, "She"),
  S(64, "The Family Man"),

  // ── Movies ───────────────────────────────────────────────────────────────
  MYT(65,  "Ratha Kabhairavi"),
  MYT(66,  "Nandha"),
  MYT(67,  "Haridas"),
  MYT(68,  "Kamali"),
  MYT(69,  "Moondru Mudichu"),
  MYT(70,  "Rayil Payanangalil"),
  MYT(71,  "Pithamagan"),
  MYT(72,  "Captain Prabhakaran"),
  MYT(73,  "Apoorva Ragangal"),
  MYT(74,  "Oomai Vizhigal"),
  MYT(75,  "Mambattiyan"),
  MBox(76, "Joseph", "2018 film"),
  MBox(77, "Mardaani 2"),
  MBox(78, "Mardaani 3"),
  MBox(79, "Gladiator", "", [
    { title: "Gladiator (1999)" },
    { title: "Gladiator II (2024)" },
  ]),
  MBox(80, "Ant-Man and the Wasp"),
  MBox(81, "Guardians of the Galaxy Vol. 3"),
  MBox(82, "Zack Snyder's Justice League"),
  MBox(83, "Troy", "Watch before Odyssey"),
  MBox(84, "Ant-Man and the Wasp: Quantumania"),
  MBox(85, "Thunderbolts"),
  MBox(86, "Predators"),
  MBox(87, "Sindhu Bhairavi"),
  MYT(88,  "Aarilirunthu Arubathu Varai"),
  MYT(89,  "Apoorva Ragangal (1975)"),
  MYT(90,  "Pulan Visaranai"),
  MYT(91,  "Kattradhu Tamizh"),
  MYT(92,  "Border"),
  MBox(93, "Peaky Blinders: The Immortal Man", "Watch after Peaky Blinders series"),
  MBox(94, "URI: The Surgical Strike"),
  MBox(95, "The Kashmir Files"),
  MBox(96, "Chandramukhi 2"),
  MBox(97, "Sapta Sagaradaache Ello - Side B"),
  MBox(98, "Inception"),
  MBox(99, "Interstellar"),
  MBox(100, "Dunkirk"),
  MBox(101, "Seven Samurai"),
  MBox(102, "The Substance"),
  MBox(103, "Angels & Demons"),
  MBox(104, "The Godfather"),
  MBox(105, "Predator"),
  MBox(106, "Jujutsu Kaisen 0", "Watch after Jujutsu Kaisen series"),
  MBox(107, "Fight Club"),
  MBox(108, "The Beauty Inside"),
  MBox(109, "P.S. I Love You"),
  MBox(110, "Chainsaw Man: The Movie"),
  MBox(111, "I Want to Eat Your Pancreas"),
  MBox(112, "Vaazha 2"),
  MBox(113, "Mohiniyattam", "Part 1"),
  MBox(114, "Terminator"),
  MBox(115, "Harry Potter"),
  MBox(116, "The Godfather: Part II"),
];
