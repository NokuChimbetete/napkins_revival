import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import Reveal from "@/components/about/Reveal";
import { TEAM } from "@/components/about/team-data";
import styles from "./about.module.css";

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
  title: "About Us — Napkins",
  description: "From Magazine to Interactive Art: The Evolution of Napkins",
};

/** The four narrative rows: illustration on the left, paragraphs on the right. */
const NARRATIVE = [
  {
    src: "/assets/about/narrative-1.jpg",
    width: 1200,
    height: 596,
    alt: "A hand-drawn June 2022 calendar covered in sticky notes — “Mag?”, “reach out to prof…”, “do we need a designer?” — with “Napkins” written across the top and “Seoul” at the foot",
    paragraphs: [
      "Our story dates back to April of 2022, where four students from Minerva University came together to develop and share the beautiful stories of their classmates all around the world.",
    ],
  },
  {
    src: "/assets/about/narrative-2.jpg",
    width: 1200,
    height: 658,
    alt: "A hand-drawn magazine cover reading “Napkins”, with a red and orange ribbon curling down the front",
    paragraphs: [
      "In August 2022, Napkins published its first issue and received overwhelmingly positive feedback, both from students and professionals from outside the Minerva community.",
      "At Napkins Magazine, we proudly publish creative works from the talented individuals associated with Minerva University, including students, staff, and alumni. We publish three times a year, during the Fall, Spring, and Summer seasons. We hibernate in the winter. 🐻",
    ],
  },
  {
    src: "/assets/about/narrative-3.jpg",
    width: 1200,
    height: 737,
    alt: "A drawing of a torn napkin with red handwriting across it: “to power & propel the art of interdisciplinary imagination”",
    paragraphs: [
      "With our cornerstone set, we also began to look beyond being a magazine and experimented with interactive art exhibitions to further our mission.",
      "We realized what is unique about us is that we are a group of young adults from 10+ countries who have the privilege of living in new countries every semester. We carry with us a wealth of perspectives and creative energy that can coalesce into something powerful and beautiful.",
      "Our goal then is to experience the essence of each city and translate that into creative vision and endeavors in collaboration with local organizations and personnel from all walks of creative life.",
    ],
  },
  {
    src: "/assets/about/narrative-4.jpg",
    width: 1200,
    height: 1200,
    alt: "An illustration of a figure sitting cross-legged on top of a large black shape filled with blue and orange doodles — musical notes, flowers, spirals and scattered words",
    paragraphs: [
      "So, we talk with people from art galleries and creative spaces in the cities we live in. We talk with artists, educators, professors, and lovers of the arts. We share with them Napkins and our dreams over cups of coffee and sometimes tea.",
      "Our events focus on making arts accessible and enjoyable for all. We are driven by our mission to power and propel interdisciplinary imagination through the arts.",
      "Join us on this exciting journey as we celebrate the diverse and innovative artistic expressions from different communities! Our Instagram is where you’ll see action as it happens :)",
    ],
  },
];

export default function AboutUsPage() {
  return (
    <div className={`${styles.page} ${averia.variable} ${inter.variable}`}>
      <div className={`${styles.row} ${styles.navRow}`}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/assets/napkins-logo-square.png"
            alt="Napkins logo"
            width={182}
            height={240}
            priority
            quality={75}
            sizes="(max-width: 600px) 56px, (max-width: 900px) 140px, 110px"
          />
        </Link>
        <Link href="/About-Us" className={styles.navLink}>
          ABOUT US
        </Link>
        <Link href="/#magazine" className={styles.navLink}>
          MAGAZINE
        </Link>
        <Link href="/Events" className={styles.navLink}>
          EVENTS
        </Link>
        <a href="mailto:napkinsmag@gmail.com" className={styles.navLink}>
          CONTACT
        </a>
      </div>

      <div className={styles.row}>
        {/* a <small> on the original — an <h1> here so the page has a real
            heading, styled to match */}
        <h1 className={styles.eyebrow}>About Us</h1>
      </div>

      <div className={`${styles.row} ${styles.displayRow}`}>
        <h2 className={styles.display}>
          From Magazine to Interactive Art: The Evolution of Napkins
        </h2>
      </div>

      {NARRATIVE.map((row) => (
        <div key={row.src} className={`${styles.row} ${styles.narrativeRow}`}>
          <div className={styles.narrativeImage}>
            <Image
              src={row.src}
              alt={row.alt}
              width={row.width}
              height={row.height}
              quality={75}
              sizes="(max-width: 600px) 92vw, (max-width: 900px) 84vw, 42vw"
            />
          </div>
          <div className={styles.narrativeText}>
            {row.paragraphs.map((text) => (
              <Reveal key={text.slice(0, 40)}>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      ))}

      <div className={`${styles.row} ${styles.teamHeadingRow}`}>
        <h2 className={styles.display}>Meet the Team</h2>
      </div>

      {/* Every name, role and photo below comes from team-data.ts — see the
          instructions at the top of that file. The list is flat, so the cells
          wrap on their own and a short final row stays left-aligned. */}
      <div className={styles.row}>
        <div className={styles.teamGrid}>
          {TEAM.map((member) => (
            <div key={member.photo} className={styles.teamCell}>
              <div className={styles.teamPhoto}>
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  quality={75}
                  sizes="(max-width: 600px) 44vw, (max-width: 900px) 28vw, 17vw"
                />
              </div>
              <div className={styles.teamName}>
                {member.name}
                {member.pronouns ? ` (${member.pronouns})` : ""}
              </div>
              <div className={styles.teamRole}>{member.role}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.row} ${styles.learnRow}`}>
        <div className={styles.learnLabel}>Learn more about:</div>
        <div className={styles.learnLinks}>
          <Link href="/Submit-to-the-Magazine">submitting to the magazine</Link>
          <Link href="/Join-the-Team">joining the team</Link>
          <Link href="/Events">participating in interactive exhibitions</Link>
        </div>
      </div>

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
