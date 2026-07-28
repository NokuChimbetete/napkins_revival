/**
 * Smooth scroll that survives a long magazine.
 *
 * `scrollIntoView({ behavior: "smooth" })` is unusable here: an issue is tens of
 * thousands of pixels tall, and images loading in as you pass them shift the
 * layout, so the browser's fixed destination goes stale mid-flight and you land
 * in the wrong place — or Chrome simply cancels the scroll. That's why the old
 * contents drawer jumped instantly instead.
 *
 * This re-measures the destination on every frame, so a shift below the fold
 * just re-aims the flight instead of ruining it. The easing is time-based, so
 * the journey always takes the same, predictable moment.
 */

/** easeInOutCubic — unhurried at both ends, quick through the middle */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type FlyOptions = {
  /** px of breathing room above the target (clears the sticky bar) */
  offset?: number;
  onArrive?: () => void;
};

/**
 * Fly the window to `target`. Returns a cancel function; the flight also
 * cancels itself the moment the reader touches the wheel, a key or the screen,
 * so it never fights someone who has changed their mind.
 */
export function flyTo(target: HTMLElement, { offset = 84, onArrive }: FlyOptions = {}) {
  const destinationOf = () =>
    Math.max(
      0,
      Math.min(
        target.getBoundingClientRect().top + window.scrollY - offset,
        document.documentElement.scrollHeight - window.innerHeight
      )
    );

  if (reduceMotion()) {
    window.scrollTo(0, destinationOf());
    onArrive?.();
    return () => {};
  }

  const start = window.scrollY;
  const distance = Math.abs(destinationOf() - start);
  if (distance < 2) {
    onArrive?.();
    return () => {};
  }

  // Long jumps earn a little more time, but never enough to feel like waiting:
  // ~420ms next door, ~900ms across the whole issue.
  const duration = Math.min(900, Math.max(420, 320 + distance * 0.09));

  const t0 = performance.now();
  let raf = 0;
  let done = false;

  const stop = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };

  // passive: we never preventDefault — the reader always wins
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);

  const step = (now: number) => {
    if (done) return;
    const p = Math.min(1, (now - t0) / duration);
    // re-read every frame: this is what makes it immune to layout shift
    const destination = destinationOf();
    window.scrollTo(0, start + (destination - start) * ease(p));
    if (p < 1) {
      raf = requestAnimationFrame(step);
    } else {
      stop();
      onArrive?.();
    }
  };

  raf = requestAnimationFrame(step);
  return stop;
}
