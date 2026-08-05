import Image from "next/image";
import styles from "@/app/Events/events.module.css";
import { EVENT_IMAGES, type EventImageKey } from "./event-images";

/**
 * Cargo's twelve-column grid, as it actually behaves.
 *
 * Not a gap: each cell carries inner padding and the row cancels it with a
 * negative margin, so a cell's content lines up with the page padding. The
 * arithmetic and the measurements behind it are in events.module.css.
 *
 * `wide` is Cargo's grid-pad="3" (19.44px cells, used by the navigation,
 * credits and team rows); the default is grid-pad="2" (12.96px), which is what
 * the body of every exhibition uses.
 */
export function Row({
  wide,
  className = "",
  children,
}: {
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.row} ${wide ? styles.rowWide : ""} ${className}`}>{children}</div>
  );
}

/**
 * One cell. `from` is the column it starts in and `span` how many it covers,
 * both taken straight from the original's markup — Cargo padded its rows with
 * empty spacer <div>s, and starting the cell explicitly does the same job
 * without putting empty elements in front of a screen reader.
 *
 * `narrow` marks a cell that should widen on a tablet, where the artwork
 * behind it has been scaled down and the text no longer needs to keep out of
 * its way.
 */
export function Col({
  from,
  span,
  narrow,
  className = "",
  children,
}: {
  from?: number;
  span: number;
  narrow?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`${styles.col} ${className}`}
      data-narrow={narrow || undefined}
      style={{ "--from": from, "--span": span } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * A picture at Cargo's own `data-scale` — the width it took up in its column,
 * as a percentage. It is part of the layout rather than decoration, so it is
 * reproduced rather than normalised to 100%.
 */
export function Figure({
  image,
  alt,
  sizes,
  priority,
  className = "",
}: {
  image: EventImageKey;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const img = EVENT_IMAGES[image];
  const scale = "scale" in img ? img.scale : 100;
  return (
    <figure
      className={`${styles.figureScaled} ${className}`}
      style={{ "--scale": `${scale}%` } as React.CSSProperties}
    >
      <Image
        src={img.src}
        alt={alt}
        width={img.width}
        height={img.height}
        quality={75}
        priority={priority}
        sizes={sizes}
      />
    </figure>
  );
}

/** The down arrow under the opening title. Cargo used a private-use glyph
 *  (U+E08C) from its own icon font, which renders as nothing without it. The
 *  viewBox is taller than it is wide, matching the proportions of the original
 *  — a long stem with a wide open head, not a square icon. */
export function ScrollCue() {
  return (
    <svg
      className={styles.scrollCue}
      viewBox="0 0 24 34"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 1v30M3 21l9 11 9-11" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  );
}
