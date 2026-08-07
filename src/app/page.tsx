import type { Metadata } from "next";
import { getIssues } from "@/lib/issues";
import { Bookshelf } from "@/components/landing/Bookshelf";
import { InspirationWall } from "@/components/landing/InspirationWall";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { StickyNotes } from "@/components/landing/StickyNotes";
import { VintageStrip } from "@/components/landing/VintageStrip";
import styles from "@/components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "Napkins — Art & Literature Zine",
};

export default async function Home() {
  const issues = await getIssues();

  return (
    <div className={styles.page}>
      {/* over the page, not in front of it: the landing page loads and paints
          behind the card, so dismissing it reveals a page that is already there */}
      <IntroAnimation />
      <VintageStrip />
      <LandingHeader />
      <div style={{ height: 52 }} />
      <div className={styles.wallZone}>
        <Bookshelf issues={issues} />
        <InspirationWall />
        <StickyNotes />
      </div>
      <SiteFooter />
    </div>
  );
}
