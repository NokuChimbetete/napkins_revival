import Image from "next/image";
import Link from "next/link";
import { EstBadge } from "./EstBadge";
import { SecretDoor } from "./SecretDoor";
import styles from "./landing.module.css";

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/About-Us" className={styles.navLink}>
          ABOUT US
        </Link>
        <a href="#magazine" className={styles.navLink}>
          MAGAZINE
        </a>
        <a href="/Events" className={styles.navLink}>
          EVENTS
        </a>
      </nav>
      <EstBadge />
      <SecretDoor />
      <div className={styles.titleWrap}>
        <Image
          src="/assets/napkins-title.webp"
          alt="NAPKINS, spelled out in cut-and-torn paper letters, with the N drawn inside a hand-sketched napkin"
          width={2423}
          height={775}
          priority
          // Served exactly as it is, not through the image optimiser. The
          // optimiser re-encodes to AVIF or WebP at quality 75, which is lossy
          // — and this file is a lossless WebP holding the artwork's own
          // pixels, verified byte-for-byte against the source. Optimising it
          // would quietly undo that. `sizes` is dropped with it: there is one
          // file and no srcset for it to choose from.
          unoptimized
          className={styles.titleImg}
        />
        <div className={styles.tagline}>
          Art and Literature Zine for Minervans, by Minervans
        </div>
      </div>
    </header>
  );
}
