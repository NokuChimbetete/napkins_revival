"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/About-Us/about.module.css";

/**
 * The narrative paragraphs' fade-and-rise, carried over from the Cargo site.
 *
 * The original ran a scroll listener that added `.active` when
 * `getBoundingClientRect().top < innerHeight - 150`, and removed it again on
 * the way back up, so a block re-animates every time it re-enters. An
 * IntersectionObserver with a -150px bottom root margin fires on exactly that
 * boundary without running work on every scroll frame.
 *
 * Reduced motion is handled in CSS: the media query pins the block visible, so
 * the class still toggles but paints nothing.
 */
export default function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer (or an old browser): show the text rather than stranding it
    // at opacity 0 forever. Deferred by a tick — setting state synchronously
    // here would cascade a second render on every block on mount.
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setActive(true), 0);
      return () => clearTimeout(t);
    }

    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "0px 0px -150px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${active ? styles.revealActive : ""}`}>
      {children}
    </div>
  );
}
