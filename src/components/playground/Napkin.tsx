"use client";

import { memo } from "react";
import type { NapkinMeta } from "@/lib/playground";
import styles from "./playground.module.css";

/**
 * One napkin, absolutely placed on the pannable field at its hash-derived
 * spot. The resting tilt lives on `.napkin`; the 3D flip faces live on the
 * inner `.flipper` (cloned for the fly-to-modal animation, so its structure
 * must stay self-contained). Only transform/opacity are ever animated.
 */
function NapkinImpl({
  napkin,
  fontFamily,
  onOpen,
  onPrefetch,
}: {
  napkin: NapkinMeta;
  fontFamily: string;
  onOpen: (slug: string) => void;
  /** warm the piece into cache before the click, so the flip is the only wait */
  onPrefetch: (slug: string) => void;
}) {
  const { look } = napkin;
  const paperBase = `/playground/papers/paper-${look.variant}`;
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
        // pointerdown fires ~100ms before click, and hover earlier still on a
        // mouse; by the time the 420ms flight ends the body is usually cached
        onPointerEnter={() => onPrefetch(napkin.slug)}
        onPointerDown={() => onPrefetch(napkin.slug)}
        onFocus={() => onPrefetch(napkin.slug)}
        aria-haspopup="dialog"
        aria-label={`${napkin.title}${byline ? ` — ${byline}` : ""}. Open piece.`}
      >
        <span className={styles.napkin}>
          <span className={styles.flipper}>
            <span className={styles.face}>
              {/* Plain <picture>, not next/image: the 7 papers are pre-sized
                  local files shared by all 110 napkins, so the optimiser would
                  add wrappers and nothing else. AVIF is ~66% smaller than the
                  WebP and keeps the torn edges' alpha; the WebP stays as the
                  fallback for browsers without AVIF. */}
              <picture>
                <source srcSet={`${paperBase}.avif`} type="image/avif" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.paper}
                  src={`${paperBase}.webp`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </picture>
              <span className={styles.text} data-long={napkin.title.length > 26 || undefined}>
                <span className={styles.title}>{napkin.title}</span>
                {byline && <span className={styles.author}>{byline}</span>}
              </span>
            </span>
            <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
              <picture>
                <source srcSet={`${paperBase}.avif`} type="image/avif" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.paper}
                  src={`${paperBase}.webp`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                />
              </picture>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

/**
 * Memoised so opening a napkin doesn't re-render all ~110 of them. Measured
 * cost of that re-render is small (~24ms from state-set to modal shown), so
 * this is hygiene rather than a fix — it keeps the open path flat as the
 * archive grows. Every prop is stable: metadata is built once on the server
 * and both callbacks are useCallback'd.
 */
export const Napkin = memo(NapkinImpl);
