import type { Metadata } from "next";
import { getIssues } from "@/lib/issues";
import { Bookshelf } from "@/components/landing/Bookshelf";
import { InspirationWall } from "@/components/landing/InspirationWall";
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
