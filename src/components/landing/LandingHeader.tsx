import Image from "next/image";
import styles from "./landing.module.css";

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <a href="#about" className={styles.navLink}>
          ABOUT US
        </a>
        <a href="#magazine" className={styles.navLink}>
          MAGAZINE
        </a>
        <a href="#events" className={styles.navLink}>
          EVENTS
        </a>
      </nav>
      <div className={styles.estBadge}>est. 2022</div>
      <Image
        src="/assets/smile-button.svg"
        alt="Hand-drawn smiley doodle"
        width={150}
        height={150}
        className={styles.smiley}
      />
      <div className={styles.titleWrap}>
        <Image
          src="/assets/napkins-title.png"
          alt="NAPKINS paper cut-out wordmark"
          width={814}
          height={260}
          priority
          className={styles.titleImg}
        />
        <div className={styles.tagline}>
          Art and Literature Zine for Minervans, by Minervans
        </div>
      </div>
    </header>
  );
}
