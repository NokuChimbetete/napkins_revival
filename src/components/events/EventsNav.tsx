import Image from "next/image";
import Link from "next/link";
import styles from "@/app/Events/events.module.css";
import type { ActId } from "./events-data";

/**
 * The site's navigation, pinned to the top of every page in the Events section.
 *
 * Cargo carried this as a "pin" — an element repeated on every page — and it
 * was fixed rather than in the flow (`.page_container.overlay.fixed`, z-index
 * 4), so it stayed put while the page scrolled underneath. That is reproduced
 * here, and it is what the landing page's own nav does too.
 *
 * The type is the landing page's: Special Elite at 15px with 2px of tracking
 * and an orange rule that appears underneath on hover — not the 1.2rem sans of
 * Cargo's own pin. This is the one piece of the section deliberately matched to
 * the rest of the site rather than to the old one, because it is site furniture
 * rather than part of any exhibition. It is also a flex bar rather than a cell
 * of the twelve-column grid: at 15px with 2px tracking "MAGAZINE" is about
 * 100px wide and a column is 64px, which is what made the words collide.
 *
 * `act` is passed only on /Events, where the page scrolls from Fractal's dark
 * photograph onto three white ones and the ink has to change with it. The
 * subpages have one background each and inherit their ink from the page.
 */
export function EventsNav({ act }: { act?: ActId }) {
  return (
    <div className={styles.navBar} data-act={act}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/assets/napkins-logo-square.png"
          alt="Napkins logo"
          width={182}
          height={240}
          priority
          quality={75}
          sizes="72px"
        />
      </Link>
      <nav className={styles.navLinks} aria-label="Site">
        <Link href="/About-Us" className={styles.navLink}>
          ABOUT US
        </Link>
        <Link href="/#magazine" className={styles.navLink}>
          MAGAZINE
        </Link>
        <Link href="/Events" className={styles.navLink}>
          EVENTS
        </Link>
      </nav>
    </div>
  );
}
