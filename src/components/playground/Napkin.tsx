"use client";

import type { NapkinMeta } from "@/lib/playground";
import styles from "./playground.module.css";

/**
 * One napkin, absolutely placed on the pannable field at its hash-derived
 * spot. The resting tilt lives on `.napkin`; the 3D flip faces live on the
 * inner `.flipper` (cloned for the fly-to-modal animation, so its structure
 * must stay self-contained). Only transform/opacity are ever animated.
 */
export function Napkin({
  napkin,
  fontFamily,
  onOpen,
}: {
  napkin: NapkinMeta;
  fontFamily: string;
  onOpen: (slug: string) => void;
}) {
  const { look } = napkin;
  const paper = `/playground/papers/paper-${look.variant}.webp`;
  const byline = napkin.author_name
    ? `${napkin.author_name}${napkin.class_year ? ` (${napkin.class_year})` : ""}`
    : "";
  return (
    <div
      className={styles.spot}
      data-napkin-slug={napkin.slug}
      style={{ left: `${look.fx}%`, top: `${look.fy}%`, zIndex: look.z }}
    >
      <button
        type="button"
        className={styles.scene}
        data-size={look.size}
        data-variant={look.variant}
        data-preset={look.fontPreset}
        style={{ "--tilt": `${look.tilt}deg`, fontFamily } as React.CSSProperties}
        onClick={() => onOpen(napkin.slug)}
        aria-haspopup="dialog"
        aria-label={`${napkin.title}${byline ? ` — ${byline}` : ""}. Open piece.`}
      >
        <span className={styles.napkin}>
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
