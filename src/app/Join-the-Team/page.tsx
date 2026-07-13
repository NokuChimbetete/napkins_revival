import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import styles from "../Submit-to-the-Magazine/submit.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Join the Team — Napkins",
};

export default function JoinTheTeamPage() {
  return (
    <div className={`${styles.page} ${averia.variable} ${inter.variable}`}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/assets/napkins-logo-square.png"
            alt="Napkins logo"
            width={182}
            height={240}
            style={{ width: 56, height: "auto" }}
          />
        </Link>
        <nav className={styles.nav}>
          <Link href="/#about" className={styles.navLink}>
            ABOUT US
          </Link>
          <Link href="/#magazine" className={styles.navLink}>
            MAGAZINE
          </Link>
          <Link href="/#events" className={styles.navLink}>
            EVENTS
          </Link>
          <a href="mailto:napkinsmag@gmail.com" className={styles.navLink}>
            CONTACT
          </a>
        </nav>
      </div>

      <main className={styles.content}>
        <div className={styles.eyebrow}>Actions</div>
        <h1 className={styles.title}>Join the Team</h1>
        <p className={styles.muted}>
          Immediate roles are below, but we are expanding teams across cities. If you are
          interested in joining Napkins but don&rsquo;t see a specific opening that matches
          your skills or have other questions, message us at{" "}
          <a
            href="mailto:napkinsmag@gmail.com"
            style={{ fontWeight: 700, color: "rgba(0, 0, 0, 0.85)", textDecoration: "underline" }}
          >
            napkinsmag@gmail.com
          </a>
          .
        </p>

        <Image
          src="/assets/join-photo.avif"
          alt="Napkins team members writing together"
          width={2304}
          height={1728}
          priority
          className={styles.photo}
        />

        <p className={styles.sectionHead}>ROLES</p>
        <p className={styles.question}>There is no vacancy at the moment.</p>
      </main>

      <div className={styles.instaRow}>
        <a href="https://www.instagram.com/napkinseverywhere" aria-label="Napkins on Instagram">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.6" cy="6.4" r="1.4" fill="currentColor" />
          </svg>
        </a>
      </div>
    </div>
  );
}
