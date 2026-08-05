"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import styles from "@/app/Events/events.module.css";
import { EVENT_IMAGES } from "./event-images";
import type { GalleryItem } from "./spaces-data";

/**
 * The "move us around!" pile — Cargo's `image-gallery="montessori"`.
 *
 * Cargo stored each photograph as `{ width, x, y, z }`, all percentages, and
 * the pile as a single `height`. The part worth knowing is that x, y AND
 * height are all percentages of the pile's WIDTH — both axes share one unit,
 * which is what lets the arrangement hold its shape at any screen size.
 * Checked against Lungs: the lowest photograph's bottom edge lands on 62.5,
 * exactly the declared height.
 *
 * CSS percentage `top`, though, resolves against the parent's height, not its
 * width. So y is converted once here: a pile `h` percent tall means a
 * photograph at `y` sits at `y / h` of the way down it.
 *
 * Dragging writes --dx/--dy straight onto the element rather than going
 * through React, so a drag never re-renders the pile. It also means the mobile
 * layout can ignore the offsets completely: below 700px the CSS drops the
 * transform and lays the photographs out as a plain two-column grid, because
 * dragging inside a scrolling page on a touch screen fights the scroll.
 *
 * Nothing is persisted. A reload puts every photograph back where the
 * exhibition left it, which is the point — the arrangement is the artwork.
 */
export default function MontessoriGallery({
  height,
  items,
  verse,
}: {
  height: number;
  items: GalleryItem[];
  verse?: string[];
}) {
  const dragging = useRef<{
    el: HTMLElement;
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const topZ = useRef(items.length);

  // Move and up listen on the window for the whole lifetime of the gallery,
  // rather than being added and removed around each drag: they arrive
  // regardless of which element holds the pointer capture, or whether it was
  // lost, and both return immediately when nothing is being dragged. This is
  // the same shape as the drag in NapkinsDrawer.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragging.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.el.style.setProperty("--dx", String(d.baseX + e.clientX - d.startX));
      d.el.style.setProperty("--dy", String(d.baseY + e.clientY - d.startY));
    };
    const onUp = (e: PointerEvent) => {
      const d = dragging.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.el.removeAttribute("data-dragging");
      dragging.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // let the browser keep panning on touch; a drag here would hijack it
      if (e.pointerType === "touch") return;
      const el = e.currentTarget;
      const num = (name: string) => Number(el.style.getPropertyValue(name) || 0);

      // whichever was picked up last sits on top from then on
      topZ.current += 1;
      el.style.setProperty("--z", String(topZ.current));
      el.setAttribute("data-dragging", "true");

      dragging.current = {
        el,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: num("--dx"),
        baseY: num("--dy"),
      };

      // A nicety for the mouse, not the mechanism — the window listeners are
      // what keep the drag alive, so a refusal here is survivable.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    },
    [],
  );

  return (
    <div className={styles.gallery}>
      <p className={styles.galleryLabel}>
        move us around!
        <Arrows />
      </p>

      <div
        className={styles.pile}
        style={{ "--pileHeight": height } as React.CSSProperties}
      >
        {items.map((item) => {
          const img = EVENT_IMAGES[item.image];
          return (
            <div
              key={item.image}
              className={styles.pileItem}
              onPointerDown={onPointerDown}
              style={
                {
                  "--x": item.x,
                  // Cargo measures y against the width; CSS `top` measures
                  // against the height. See the note at the top of this file.
                  "--y": (item.y / height) * 100,
                  "--w": item.width,
                  "--z": item.z,
                } as React.CSSProperties
              }
            >
              <Image
                src={img.src}
                alt={item.alt}
                width={img.width}
                height={img.height}
                quality={75}
                draggable={false}
                sizes={`(max-width: 700px) 45vw, ${Math.round((item.width / 100) * 62)}vw`}
              />
            </div>
          );
        })}
      </div>

      {verse && (
        <p className={styles.verse}>
          {verse.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Cargo drew this with three private-use glyphs from its own icon font, which
 *  render as nothing without it. */
function Arrows() {
  return (
    <svg
      className={styles.galleryArrow}
      viewBox="0 0 24 10"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 5h22M17 1l5 4-5 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
