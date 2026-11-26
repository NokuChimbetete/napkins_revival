/**
 * The scroll the "Napkins ancestors" modal is drawn on.
 *
 * Hand-drawn in SVG rather than dropped in as a picture, for three reasons:
 * it is ours (the stock scroll this replaces was licensed artwork), it stays
 * crisp at any size, and — the practical one — it stretches. The two rollers
 * keep their shape while the parchment between them grows to fit however many
 * ancestors are in the list, which a fixed image cannot do.
 *
 * The ballpoint look comes from two tricks shared by every piece below:
 *   NK_ROUGH   a turbulence filter that nudges each outline off true, so the
 *              strokes wobble the way a pen does instead of looking plotted
 *   NK_HATCH   a diagonal line pattern used as a fill, standing in for the
 *              cross-hatch shading of a pen sketch
 * Both live in <ScrollDefs>, which is rendered once per modal.
 */

/** Ballpoint navy. Also used by the CSS, which keeps its own copy. */
const INK = "#2b3287";

export const PAPER = "#fdfcf3";

export function ScrollDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
      <defs>
        {/* the pen wobble: fractal noise displacing the outlines by ~2px */}
        <filter id="nk-rough" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="3" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* shading, as a pen would do it: parallel diagonal strokes */}
        <pattern id="nk-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <line x1="0" y1="0" x2="0" y2="7" stroke={INK} strokeWidth="1.15" opacity="0.42" />
        </pattern>

        {/* the same, denser — for the underside of a roller */}
        <pattern id="nk-hatch-dense" width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <line x1="0" y1="0" x2="0" y2="4.4" stroke={INK} strokeWidth="1.15" opacity="0.5" />
        </pattern>
      </defs>
    </svg>
  );
}

/**
 * One rolled-up end of the scroll: a bowed cylinder with a knob on each side.
 * `flip` turns it upside down for the foot of the scroll, so both ends are the
 * same drawing and the parchment always appears to come out from underneath.
 */
export function Roller({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className="nk-roller"
      viewBox="0 0 1000 120"
      aria-hidden
      focusable="false"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      <g filter="url(#nk-rough)">
        {/* the bar itself, bowed so it reads as a roll rather than a box */}
        <path
          d="M66 34 C 300 14, 700 14, 934 34 L 934 86 C 700 106, 300 106, 66 86 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Shading in two passes, the way a pen builds it up: a light one over
            the whole roll for body, then a dense one along the underside for
            the shadow. One flat pass over everything reads as a striped tube;
            none at all reads as an empty balloon. */}
        <path
          d="M66 34 C 300 14, 700 14, 934 34 L 934 86 C 700 106, 300 106, 66 86 Z"
          fill="url(#nk-hatch)"
          opacity="0.55"
        />
        <path d="M68 62 C 320 82, 680 82, 932 62 L 932 86 C 700 106, 300 106, 68 86 Z" fill="url(#nk-hatch)" />
        <path d="M74 78 C 330 96, 670 96, 926 78 L 926 86 C 680 106, 320 106, 74 86 Z" fill="url(#nk-hatch-dense)" />

        {/* the lip where the parchment wraps over the roll */}
        <path
          d="M80 44 C 320 26, 690 26, 920 44"
          fill="none"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* circular ends of the roll, each with the spiral of a rolled sheet */}
        <ellipse cx="66" cy="60" rx="18" ry="27" fill={PAPER} stroke={INK} strokeWidth="4" />
        <ellipse cx="934" cy="60" rx="18" ry="27" fill={PAPER} stroke={INK} strokeWidth="4" />
        <path d="M66 46 C 76 50, 76 70, 66 74" fill="none" stroke={INK} strokeWidth="2.2" opacity="0.8" />
        <path d="M934 46 C 924 50, 924 70, 934 74" fill="none" stroke={INK} strokeWidth="2.2" opacity="0.8" />

        {/* the knobs the scroll is wound on */}
        <ellipse cx="28" cy="60" rx="17" ry="13" fill={PAPER} stroke={INK} strokeWidth="4" />
        <ellipse cx="972" cy="60" rx="17" ry="13" fill={PAPER} stroke={INK} strokeWidth="4" />
        <path d="M40 60 H 50" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M950 60 H 960" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * One torn side edge of the parchment, tiled down the height of the sheet.
 *
 * A CSS background rather than a component, because that is what lets it
 * repeat for any length of content. The tile is 40x200 and its path starts and
 * ends at the same x, so the repeats join without a visible seam. It is drawn
 * facing right; the stylesheet mirrors it for the left edge.
 */
const EDGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="200" viewBox="0 0 40 200">
  <path d="M30 0 C 26 34, 34 42, 29 58 C 24 76, 33 84, 28 104 L 34 118 L 27 126 C 23 146, 32 156, 29 176 C 27 188, 30 194, 30 200"
    fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g stroke="${INK}" stroke-width="1.6" opacity="0.5" stroke-linecap="round">
    <path d="M33 14 l 6 9"/><path d="M31 46 l 7 8"/><path d="M34 88 l 6 10"/>
    <path d="M31 132 l 7 9"/><path d="M33 168 l 6 8"/>
  </g>
</svg>`;

export const EDGE_TILE = `url("data:image/svg+xml,${encodeURIComponent(EDGE_SVG.replace(/\s+/g, " "))}")`;
