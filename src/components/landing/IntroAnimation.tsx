"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./landing.module.css";

/** How long before a returning visitor is shown the intro again. */
export const INTRO_REPLAY_AFTER_MS = 24 * 60 * 60 * 1000;
export const INTRO_STORAGE_KEY = "napkins:intro-seen";
/** Dispatched on `window` by the "est. 2022" badge — see EstBadge.tsx. */
export const REPLAY_INTRO_EVENT = "napkins:replay-intro";

/** How long the card takes to fade into the page. Matches the CSS. */
const FADE_MS = 900;
/**
 * If playback has not *begun* by now, the network or the codec has failed and
 * the card gets out of the way. It is deliberately generous: the video is only
 * fetched when play() asks for it, so a slow first byte is normal and is not a
 * reason to give up. An earlier version bailed at 1.5s if currentTime was
 * still 0, which dismissed the card mid-load and read as it vanishing on its
 * own.
 */
const NEVER_STARTED_MS = 8000;
/** Once it is playing, the cap is its own length plus a margin. */
const OVERRUN_MS = 2000;

/**
 * The title card: the logo unfolds and "Napkins" letters itself, then the
 * landing page is underneath it.
 *
 * It plays on a first arrival and then not again for a day. Three separate
 * things stop it, and it is worth knowing which does what:
 *
 *   - The inline script in the root layout, which runs before the browser
 *     paints anything, sets `data-intro="seen"` on <html> when the visitor has
 *     seen it recently, has asked for reduced motion, or did not land on "/".
 *     CSS keyed to that attribute keeps this overlay from ever being painted,
 *     so a returning visitor gets no flash of it at all. Deciding in an effect
 *     instead would show the card for a frame before hiding it.
 *   - This component, which only runs when the card is actually playing.
 *   - The CSS, which hides it under `prefers-reduced-motion` as a backstop in
 *     case the script did not run.
 *
 * The markup is identical on the server and on the client — the overlay is
 * always rendered and CSS decides whether it is visible — so there is no
 * hydration mismatch to suppress.
 *
 * There is no path where this can strand somebody on a white screen: it is
 * dismissed by the video ending, by the Skip button, by Escape, by a failure
 * to start playing at all, and by a cap once it has started.
 */

/**
 * Set once the card has run in this document, so a soft navigation back to "/"
 * does not replay it. It cannot be state: the point is that it survives the
 * component unmounting. It is deliberately not read during the first render —
 * it is false then on both the server and the client, so there is nothing to
 * mismatch.
 */
let playedInThisDocument = false;

export function IntroAnimation() {
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">(() =>
    playedInThisDocument ? "gone" : "showing",
  );
  // bumped to replay; the play effect keys off it, so a replay re-runs the
  // whole setup rather than needing a second code path
  const [run, setRun] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback(() => {
    if (done.current) return;
    done.current = true;
    playedInThisDocument = true;
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, String(Date.now()));
    } catch {
      // private mode, storage disabled — the card just plays again next time
    }

    // Back to the top while the card is still opaque, so the page is never
    // revealed part-way down if somebody scrolled behind it. Not a lock: see
    // the note in landing.module.css for why locking caused a visible jump.
    window.scrollTo(0, 0);

    setPhase("leaving");
    timers.current.push(
      window.setTimeout(() => {
        // Only now, after the fade has finished. Setting it up front — which is
        // what an earlier version did — hides the card instantly via the
        // `[data-intro="seen"]` rule, so the opacity transition never gets to
        // run and the card cuts to the page rather than dissolving into it.
        // It also releases the scroll lock, which is keyed to the same value.
        document.documentElement.dataset.intro = "seen";
        setPhase("gone");
      }, FADE_MS),
    );
  }, []);

  /** Put it back to how a first arrival finds it, and play it again. */
  const replay = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    done.current = false;
    playedInThisDocument = false;
    try {
      localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch {
      // nothing to clear
    }
    document.documentElement.dataset.intro = "new";
    setPhase("showing");
    setRun((n) => n + 1);
  }, []);

  useEffect(() => {
    window.addEventListener(REPLAY_INTRO_EVENT, replay);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, replay);
  }, [replay]);

  useEffect(() => {
    // Already decided against before the first paint. The CSS has it at
    // display:none, so there is nothing to hide, nothing to dismiss and no
    // reason to write storage — and because the video stays preload="none"
    // unless this branch is skipped, returning visitors never fetch it either.
    if (playedInThisDocument || document.documentElement.dataset.intro === "seen") {
      done.current = true;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Asked for here rather than in the markup: the element ships as
    // preload="none" so a returning visitor downloads nothing, and only the
    // arrival that is actually going to play it pays for the fetch.
    video.preload = "auto";

    /**
     * Browsers refuse play() in a document that is not visible, so a page
     * opened in a background tab — a middle-click, "open in new tab" — would
     * have had its card dismissed before anyone saw it, and marked as seen.
     * So a refusal while hidden is not a failure; it waits and tries again
     * when the tab is actually looked at. The watchdog starts from that point
     * too, or a tab left in the background for eight seconds would time out.
     */
    const tryPlay = () => {
      if (done.current || document.hidden) return;
      video.currentTime = 0; // a replay starts from the beginning
      // autoplay is only permitted muted, which is also why the audio track was
      // stripped from the file rather than shipped and never heard
      video.play().catch(() => dismiss());
      timers.current.push(
        window.setTimeout(() => {
          if (video.currentTime === 0) dismiss();
        }, NEVER_STARTED_MS),
      );
    };
    tryPlay();
    document.addEventListener("visibilitychange", tryPlay);

    // Escape only. Any-key and click-anywhere dismissed the card while people
    // were still watching it — a stray click or a tap of the spacebar is not
    // somebody asking to skip. Skip is a button for that.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    const onPlaying = () => {
      // it is running, so from here the only cap is the clip's own length
      const runtime = (Number.isFinite(video.duration) ? video.duration : 4) * 1000;
      timers.current.push(window.setTimeout(dismiss, runtime + OVERRUN_MS));
    };
    video.addEventListener("playing", onPlaying, { once: true });

    const pending = timers.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", tryPlay);
      video.removeEventListener("playing", onPlaying);
      pending.forEach(window.clearTimeout);
    };
  }, [dismiss, run]);

  if (phase === "gone") return null;

  return (
    <div
      // `intro-card` is a plain, unhashed class so the <noscript> rule in the
      // root layout can reach it — CSS module names are not predictable
      className={`${styles.intro} intro-card`}
      data-phase={phase}
      // Not click-to-dismiss. The card is four seconds long and people move the
      // mouse and click while watching it; taking that as "skip" meant it
      // disappeared out from under them. Skip is the button.
      //
      // it is decoration over the real page, which is already in the DOM
      // behind it and is what a screen reader should be reading
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className={styles.introVideo}
        src="/assets/intro-animation.mp4"
        poster="/assets/intro-animation-poster.webp"
        muted
        playsInline
        // nothing is fetched until play() asks for it, so a returning visitor
        // — whose card is display:none — downloads none of it
        preload="none"
        onEnded={dismiss}
        onError={dismiss}
      />
      <button type="button" className={styles.introSkip} onClick={dismiss}>
        Skip
      </button>
    </div>
  );
}
