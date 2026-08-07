// Shared by server code (lib/drawer) and the client font roster
// (app/drawer/fonts). Keep this module dependency-free: it's imported
// from client components, so nothing server-only may leak in here.

/** permanent — changing the modulus re-deals every napkin's paper */
export const PAPER_COUNT = 7;

/** must equal NAPKIN_FONTS.length in src/app/drawer/fonts.ts (asserted there) */
export const FONT_PRESET_COUNT = 14;
