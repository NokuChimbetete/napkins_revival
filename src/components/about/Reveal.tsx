"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/About-Us/about.module.css";

/**
 * The narrative paragraphs' fade-and-rise, carried over from the Cargo site.
 *
 * The original ran a scroll listener that added `.active` when
 * `getBoundingClientRect().top < innerHeight - 150`, and removed it again on
 * the way back up, so a block faded out and re-animated every time it left and
 * re-entered. That is not reproduced: once a paragraph has been read it stays
 * on the page, and scrolling back up finds it where it was left rather than
 * watching it dissolve. An IntersectionObserver fires on the same -150px
 * boundary the original scrolled for, then stops watching that block for good.
 *
 * Reduced motion is handled in CSS: the media query pins the block visible, so
 * the class still applies but paints nothing.
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

    // Unobserved as soon as it has shown, so nothing here runs again for the
    // rest of the visit — and so the block can never be told to hide.
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setActive(true);
          observer.unobserve(entry.target);
        }
      },
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
