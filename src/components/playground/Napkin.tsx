"use client";

import type { NapkinMeta } from "@/lib/playground";
import styles from "./playground.module.css";

/**
 * One napkin: a paper cutout with the piece's title and byline in its
 * assigned typeface. The scatter transform (tilt + jitter) lives on
 * `.napkin`; the 3D flip lives on the inner `.flipper` so the two compose
 * without fighting. Only transform/opacity are ever animated.
 */
export function Napkin({
  napkin,
  fontFamily,
  flipped,
  onOpen,
}: {
  napkin: NapkinMeta;
  fontFamily: string;
  flipped: boolean;
  onOpen: (slug: string) => void;
}) {
  const { look } = napkin;
  const paper = `/playground/papers/paper-${look.variant}.webp`;
  const byline = napkin.author_name
    ? `${napkin.author_name}${napkin.class_year ? ` (${napkin.class_year})` : ""}`
    : "";
  return (
    <div className={styles.cell} style={{ "--z": look.z } as React.CSSProperties}>
      <button
        type="button"
        className={styles.scene}
        data-size={look.size}
        data-variant={look.variant}
        data-preset={look.fontPreset}
        style={
          {
            "--tilt": `${look.tilt}deg`,
            "--jx": `${look.jitterX}%`,
            "--jy": `${look.jitterY}%`,
            fontFamily,
          } as React.CSSProperties
        }
        onClick={() => onOpen(napkin.slug)}
        aria-haspopup="dialog"
        aria-label={`${napkin.title}${byline ? ` — ${byline}` : ""}. Open piece.`}
      >
        <span className={`${styles.napkin}${flipped ? ` ${styles.flipped}` : ""}`}>
          <span className={styles.flipper}>
            <span className={styles.face}>
              {/* plain <img>: the 7 papers are pre-downscaled local WebPs shared
                  by all 110 napkins — next/image adds nothing but wrappers here */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.paper}
                src={paper}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <span className={styles.text} data-long={napkin.title.length > 26 || undefined}>
                <span className={styles.title}>{napkin.title}</span>
                {byline && <span className={styles.author}>{byline}</span>}
              </span>
            </span>
            <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.paper} src={paper} alt="" loading="lazy" draggable={false} />
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
