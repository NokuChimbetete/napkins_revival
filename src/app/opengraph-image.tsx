import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The link preview card, used by every route that does not supply its own.
 *
 * Drawn rather than stored as a PNG so it stays in step with the palette: the
 * colours below are the ones globals.css and the landing page already use, and
 * the wordmark is the same file the site header serves. Nothing to re-export
 * when the art changes.
 *
 * Satori, which renders this, supports only flexbox and a subset of CSS — no
 * grid, no float. Every container therefore declares display:flex explicitly,
 * including ones with a single child, because Satori throws on a div with
 * multiple children that has no display set.
 */

export const alt = "Napkins — an art zine for Minervans by Minervans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#fdf0da";
const RUST = "#b4470f";
const INK = "#1b1b1b";

export default async function Image() {
  // Read from the project root, not relative to this file — the compiled
  // output does not sit where the source does.
  const logo = await readFile(join(process.cwd(), "public/assets/napkins-logo.png"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          // A printed edge, so the card reads as a page rather than a banner.
          border: `16px solid ${RUST}`,
        }}
      >
        {/* 814x260 in the source, held to 620 wide so it sits comfortably
            inside the border at the 1200x630 social crop. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws
            this into a PNG on the server; next/image has no runtime here. */}
        <img src={`data:image/png;base64,${logo}`} width={620} height={198} alt="" />

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 34,
            letterSpacing: 1,
            color: INK,
          }}
        >
          An art zine for Minervans by Minervans
        </div>

        <div style={{ display: "flex", marginTop: 28, width: 120, height: 4, background: RUST }} />
      </div>
    ),
    size,
  );
}
