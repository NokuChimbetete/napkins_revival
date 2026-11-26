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
 * The parchment between the two rollers: the whole sheet as one shape, sized
 * to whatever box it is dropped into.
 *
 * Paper hung between two rolls does not have straight sides. It pinches in at
 * the middle and swells back out at the ends, and the edge is nicked rather
 * than ruled — that barrel is most of what makes this read as a scroll and
 * not as a dialog box with decoration at the top and bottom.
 *
 * The curve has to survive the sheet growing, so the box is stretched rather
 * than scaled (`preserveAspectRatio="none"`): a side that bows inward still
 * bows inward at any height. Two things would give that away, and both are
 * dealt with — the outline keeps its weight through `non-scaling-stroke`, and
 * the shading is not in here at all, because a hatch pattern stretched down a
 * tall sheet smears into stripes. <SheetShade> puts it back at a fixed height
 * against each roller, which is where a pen would have left it anyway.
 */
export function SheetFrame() {
  return (
    <svg
      className="nk-sheet-frame"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <path
        d={[
          // top edge, sagging a little under the roller
          "M64 12",
          "C 300 30, 700 30, 936 12",
          // right edge: out at the top, pinched at the waist, out again,
          // with two nicks torn out of it
          "C 912 120, 926 150, 902 238",
          "L 912 262 L 900 286",
          "C 922 384, 908 474, 936 588",
          // bottom edge, bowing the other way
          "C 700 570, 300 570, 64 588",
          // left edge back up, mirrored
          "C 92 474, 78 384, 100 286",
          "L 88 262 L 98 238",
          "C 74 150, 88 120, 64 12",
          "Z",
        ].join(" ")}
        fill={PAPER}
        stroke={INK}
        strokeWidth="4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The hatching where the parchment meets a roller — a band of shading at a
 * fixed height, so it never stretches with the sheet. `flip` turns it over for
 * the foot of the scroll.
 */
export function SheetShade({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className="nk-sheet-shade"
      viewBox="0 0 1000 90"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      {/* heaviest right under the roll, gone within a finger's width */}
      <path d="M70 0 C 300 20, 700 20, 932 0 L 932 34 C 700 54, 300 54, 70 34 Z" fill="url(#nk-hatch)" opacity="0.5" />
      <path d="M74 0 C 300 18, 700 18, 928 0 L 928 15 C 700 35, 300 35, 74 15 Z" fill="url(#nk-hatch)" opacity="0.75" />
    </svg>
  );
}
