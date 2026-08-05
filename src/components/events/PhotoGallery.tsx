"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/Events/events.module.css";
import { EVENT_IMAGES } from "./event-images";
import type { Picture } from "./events-data";

/**
 * The twenty-five photographs, and a lightbox to see one properly.
 *
 * Cargo called this a "Freeform" gallery, which in practice meant a strict
 * alternation of two-thirds and one-third widths, so the photographs pair off
 * across the page and the pairing survives any number of them. That comes off
 * the index rather than being written out, so adding or removing one re-pairs
 * the rest.
 *
 * The lightbox is a native <dialog>. showModal() brings the whole set of
 * behaviours the job needs — focus trapping, inert background, Escape to
 * close, a ::backdrop to style — without a dependency, and leaves the page
 * behind it exactly where it was.
 */
export default function PhotoGallery({ photos }: { photos: Picture[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (by: number) => setOpen((i) => (i === null ? null : (i + by + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open === null) {
      if (el.open) el.close();
      return;
    }
    if (!el.open) el.showModal();
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={styles.photoFlow}>
        {photos.map((photo, i) => {
          const img = EVENT_IMAGES[photo.image];
          // Cargo's alternation: two thirds, then one third, and repeat.
          const wide = i % 2 === 0;
          return (
            <li
              key={photo.image}
              className={styles.photoCell}
              data-wide={wide || undefined}
              style={{ "--w": wide ? 66.666 : 33.33 } as React.CSSProperties}
            >
              <button type="button" className={styles.photoButton} onClick={() => setOpen(i)}>
                <Image
                  src={img.src}
                  alt={photo.alt}
                  width={img.width}
                  height={img.height}
                  quality={75}
                  sizes={wide ? "(max-width: 700px) 92vw, 62vw" : "(max-width: 700px) 92vw, 31vw"}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <dialog ref={dialogRef} className={styles.lightbox} onClose={close}>
        {current && (
          <>
            <Image
              src={EVENT_IMAGES[current.image].src}
              alt={current.alt}
              width={EVENT_IMAGES[current.image].width}
              height={EVENT_IMAGES[current.image].height}
              quality={75}
              sizes="92vw"
              className={styles.lightboxImg}
            />
            <p className={styles.lightboxCaption}>{current.alt}</p>
            <div className={styles.lightboxControls}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous photograph">
                ←
              </button>
              <span aria-hidden="true">
                {open! + 1} / {photos.length}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Next photograph">
                →
              </button>
              <button type="button" onClick={close} aria-label="Close">
                ✕
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
