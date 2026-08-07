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
          src="/assets/napkins-title.png"
          alt="NAPKINS paper cut-out wordmark"
          width={814}
          height={260}
          priority
          sizes="(max-width: 700px) 86vw, (max-width: 1023px) 84vw, 940px"
          className={styles.titleImg}
        />
        <div className={styles.tagline}>
          Art and Literature Zine for Minervans, by Minervans
        </div>
      </div>
    </header>
  );
}
