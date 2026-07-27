import localFont from "next/font/local";
import { FONT_PRESET_COUNT } from "@/lib/napkin-constants";

// The napkin typefaces. Order is load-bearing: a piece's font_preset is a
// 1-based index into this array, so REORDERING OR REMOVING entries re-deals
// every napkin's type. Append only.
//
// All preload:false — a dozen display faces must not block first paint; the
// browser fetches each on first use. Caveat and Gochi Hand ride along free:
// they're already loaded app-wide in layout.tsx (their CSS vars are global).
//
// next/font requires each call's options to be a static object literal — no
// spreads, no shared const — hence the repetition.

const canarina = localFont({
  src: "../../fonts/playground/canarina.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const cmgeom = localFont({
  src: "../../fonts/playground/cmgeom.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const gulax = localFont({
  src: "../../fonts/playground/gulax.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const cakra = localFont({
  src: "../../fonts/playground/cakra.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const chaumont = localFont({
  src: "../../fonts/playground/chaumont.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const hamlet = localFont({
  src: "../../fonts/playground/hamlet.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const sweynheim = localFont({
  src: "../../fonts/playground/sweynheim.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const syneBold = localFont({
  src: "../../fonts/playground/syne-bold.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const syneTactile = localFont({
  src: "../../fonts/playground/syne-tactile.woff2",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const leagueScript = localFont({
  src: "../../fonts/playground/league-script.woff",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const ltStopwatch = localFont({
  src: "../../fonts/playground/lt-stopwatch.ttf",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});
const sansitaSwashed = localFont({
  src: "../../fonts/playground/sansita-swashed.ttf",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export type NapkinFont = { name: string; family: string };

export const NAPKIN_FONTS: NapkinFont[] = [
  { name: "Canarina", family: canarina.style.fontFamily },
  { name: "CM Geom", family: cmgeom.style.fontFamily },
  { name: "Gulax", family: gulax.style.fontFamily },
  { name: "Cakra", family: cakra.style.fontFamily },
  { name: "Chaumont Script", family: chaumont.style.fontFamily },
  { name: "Hamlet Cicero", family: hamlet.style.fontFamily },
  { name: "Sweynheim & Pannartz", family: sweynheim.style.fontFamily },
  { name: "Syne Bold", family: syneBold.style.fontFamily },
  { name: "Syne Tactile", family: syneTactile.style.fontFamily },
  { name: "League Script", family: leagueScript.style.fontFamily },
  { name: "LT Stopwatch", family: ltStopwatch.style.fontFamily },
  { name: "Sansita Swashed", family: sansitaSwashed.style.fontFamily },
  { name: "Caveat", family: "var(--font-caveat), cursive" },
  { name: "Gochi Hand", family: "var(--font-gochi), cursive" },
];

if (NAPKIN_FONTS.length !== FONT_PRESET_COUNT) {
  throw new Error(
    `NAPKIN_FONTS has ${NAPKIN_FONTS.length} entries but FONT_PRESET_COUNT is ${FONT_PRESET_COUNT} — keep them in sync`
  );
}
