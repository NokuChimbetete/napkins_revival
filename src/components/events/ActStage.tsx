"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "@/app/Events/events.module.css";
import { EventsNav } from "./EventsNav";
import { BACKDROPS } from "./event-images";
import { ACTS, type ActId } from "./events-data";

/**
 * The four wallpapers, and the rail that says which one you are in.
 *
 * All four Cargo pages used `data-backdrop="wallpaper"`: a fixed, full-viewport
 * image behind the content. Stitched into one scroll they become four layers on
 * one fixed stage, with exactly one at opacity 1 and a 700ms cross-fade between
 * them. Only opacity is ever animated — a transform on a full-viewport fixed
 * layer is the classic way to invent a horizontal scrollbar, and it is also the
 * kind of motion people set `prefers-reduced-motion` to avoid.
 *
 * Which layer is up is decided by a single IntersectionObserver with a
 * `-50%` margin top and bottom, which collapses the viewport to a line across
 * its middle. A section is "intersecting" only while it crosses that line, and
 * because the four sections are contiguous exactly one qualifies at a time. No
 * scroll listener, no rAF, no library, and the browser keeps its scrollbar.
 *
 * The stage and the rail are one component because they answer the same
 * question. Two observers for one piece of state would be two things to keep
 * in agreement.
 *
 * Fractal is the initial state rather than "nothing": the page opens on its
 * darkened photograph, which is what the overture is written against.
 */
export default function ActStage() {
  const [act, setAct] = useState<ActId>("fractal");

  useEffect(() => {
    // No observer, or an old browser: leave Fractal up. The page reads
    // correctly, it simply does not change wallpaper.
    if (typeof IntersectionObserver === "undefined") return;

    // Observed by attribute rather than by id, because more than one element
    // can belong to the same act: the overture sits above #fractal and is
    // written against its photograph, so it carries the act too. Without that,
    // jumping straight back to the top — an anchor link, the Home key — leaves
    // whatever act was last crossed showing, since nothing is crossing the line
    // up there at all.
    const sections = [...document.querySelectorAll<HTMLElement>("[data-act-section]")];
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.actSection;
            if (id) setAct(id as ActId);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* the nav is pinned, so it scrolls from Fractal's dark photograph onto
          three white ones — it takes the act for the same reason the rail does */}
      <EventsNav act={act} />

      <div className={styles.stage} data-act={act} aria-hidden="true">
        {ACTS.map(({ id }, i) => {
          const backdrop = BACKDROPS[id];
          return (
            <div key={id} className={styles.layer} data-layer={id}>
              <Image
                src={backdrop.src}
                alt=""
                fill
                quality={75}
                // Fractal is on screen at first paint; the rest can wait.
                priority={i === 0}
                sizes="100vw"
              />
              {backdrop.overlay !== "rgba(0, 0, 0, 0)" && (
                <div className={styles.layerOverlay} style={{ background: backdrop.overlay }} />
              )}
            </div>
          );
        })}
      </div>

      <nav className={styles.rail} data-act={act} aria-label="Exhibitions">
        {ACTS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={styles.railLink}
            data-current={act === id}
            aria-current={act === id ? "true" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
