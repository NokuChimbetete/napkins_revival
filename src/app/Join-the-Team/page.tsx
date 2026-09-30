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

// The editor application form. Swap this link when a new season's form goes up.
const APPLY_URL = "https://forms.gle/tuKc8Y8CxYJqtB898";

export const metadata: Metadata = {
  title: "Join the Team — Napkins",
  description:
    "Napkins is hiring literary editors and visual editors — about two hours a month, advising one artist on the next issue.",
  alternates: { canonical: "/Join-the-Team" },
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

      <main className={styles.content}>
        <div className={styles.eyebrow}>Actions</div>
        <h1 className={styles.title}>Join the Team</h1>
        <p className={styles.muted}>
          We&rsquo;re hiring! Napkins is looking for literary editors and visual editors to
          help bring the next issue to life. If you love words, pictures, or the people who
          make them, we would love to have you.
        </p>
        <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Apply to be an editor
        </a>
        <p className={styles.muted}>
          Have questions, or want to help in a way that isn&rsquo;t listed here? Message us
          at{" "}
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
          // without this the fixed-width srcset makes a phone fetch the 3840px
          // rendition for a 339px slot
          sizes="(max-width: 700px) 92vw, (max-width: 900px) 88vw, 800px"
          className={styles.photo}
        />

        <p className={styles.sectionHead}>OPEN ROLES</p>

        <p className={styles.categoryName}>Literary Editor</p>
        <p className={styles.detail}>
          Advise one writer working on the upcoming issue, whether they write poetry,
          fiction, nonfiction or translation. You&rsquo;ll read their drafts, give feedback,
          and help them get from first idea to final piece.
        </p>

        <p className={styles.categoryName}>Visual Editor</p>
        <p className={styles.detail}>
          Advise one visual artist working on the upcoming issue, whether they work in
          art, photography, comics or animation. You&rsquo;ll look at their work in progress,
          give feedback, and help them get from first sketch to finished piece.
        </p>

        <p className={styles.sectionHead}>TIME COMMITMENT</p>
        <p className={styles.muted}>
          Advising one artist takes about 2 hours of work a month. You can choose to advise
          more than one artist this season; the application form sets out the maximum time
          commitment if you do.
        </p>

        <p className={styles.sectionHead}>HOW TO APPLY</p>
        <p className={styles.muted}>
          Fill out the application form and we&rsquo;ll match you with an artist.
        </p>
        <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Apply to be an editor
        </a>
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
