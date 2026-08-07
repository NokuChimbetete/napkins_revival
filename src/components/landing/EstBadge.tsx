"use client";

import { REPLAY_INTRO_EVENT } from "./IntroAnimation";
import styles from "./landing.module.css";

/**
 * The "est. 2022" badge, which is also how you replay the intro title card.
 *
 * A plain event on `window` rather than shared state or a context: the badge
 * lives in the header and the card is a sibling of it further up the page, and
 * neither has any other reason to know the other exists. IntroAnimation listens
 * for this and resets itself.
 *
 * Deliberately undiscoverable-looking — it reads as the badge it already was.
 * Nothing is lost if somebody presses it not knowing: they get the animation.
 */
export function EstBadge() {
  return (
    <button
      type="button"
      className={styles.estBadge}
      onClick={() => window.dispatchEvent(new CustomEvent(REPLAY_INTRO_EVENT))}
      title="Play the intro again"
    >
      est. 2022
    </button>
  );
}
