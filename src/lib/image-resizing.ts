/**
 * Temporary switch: Vercel's image resizing is off until this moment.
 *
 * The free plan allows 5,000 image transformations, and the team used the last
 * of them at 14:29 UTC on 2026-09-19. Vercel's Hobby docs say a limit comes
 * back once 30 days have passed; until then every image it hasn't already
 * resized fails with a 402 and the reader sees alt text. So until the reset,
 * images are served as the original files instead: heavier, but they load.
 *
 * The date sits a day past the reset because turning resizing back on early
 * breaks images again, while turning it on late only costs some bandwidth.
 *
 * next.config.ts reads this at build time (for every next/image), and
 * optimizeBodyImages() reads it at request time (for piece artwork). A build
 * after this date turns resizing back on by itself, and
 * .github/workflows/resume-image-resizing.yml starts that build on the day, so
 * nobody has to remember. Once it has run, this file and that workflow can be
 * deleted and the two places that import it simplified.
 */
export const IMAGE_RESIZING_PAUSED_UNTIL = "2026-10-20T15:00:00Z";

export const imageResizingPaused = (): boolean =>
  Date.now() < Date.parse(IMAGE_RESIZING_PAUSED_UNTIL);
