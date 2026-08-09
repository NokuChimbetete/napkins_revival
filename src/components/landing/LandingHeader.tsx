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
          width={1876}
          height={600}
          priority
          // Served exactly as it is, not through the image optimiser, because
          // the optimiser re-encodes to AVIF or WebP at quality 75 and this is
          // a lossless WebP.
          //
          // The file is mastered at 1876px for that reason: twice the 938px
          // the desktop rule draws it at. Skipping the optimiser also skips the
          // resampled derivatives it would have generated, so whatever is
          // shipped is what the browser has to scale down itself — and a
          // browser downscaling by 3x, as it was from a 2423px master, uses a
          // cheap filter and comes out soft. At 2x on a 1x screen and 1:1 on a
          // 2x one, there is nothing left for it to blur.
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
