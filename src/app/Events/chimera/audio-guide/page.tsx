import type { Metadata } from "next";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { EventsNav } from "@/components/events/EventsNav";
import { Col, Row } from "@/components/events/Grid";
import { AUDIO_GUIDE, TRACKS } from "@/components/events/audio-guide-data";
import { EVENT_FILES } from "@/components/events/event-images";
import styles from "@/app/Events/events.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Audio Guide — Chimera — Napkins",
  description: "Four audio guides from Chimera, with transcripts.",
  alternates: { canonical: "/Events/chimera/audio-guide" },
};

/**
 * Chimera's audio guide.
 *
 * Five Cargo pages folded into one: the index of the four clips, and a page per
 * transcript. The transcripts sit inside <details> beside their recording
 * rather than behind a link, so somebody who cannot use the audio is one click
 * from the words instead of one navigation.
 *
 * The old site also carried links to "Audio-Guides", plural, which 404s. Every
 * one of them was an empty anchor with no text inside — editing debris that
 * rendered as nothing — so none of them survived the move, and the working
 * links from Chimera now point here.
 */
export default function AudioGuidePage() {
  return (
    <div className={`${styles.page} ${styles.spacePage} ${averia.variable} ${inter.variable}`}>
      <div className={styles.act}>
        <EventsNav />

        <Row wide className={styles.breadcrumbRow}>
          <Col from={2} span={10}>
            <Link href="/Events#chimera" className={styles.breadcrumb}>
              Chimera
            </Link>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.eyebrow}>{AUDIO_GUIDE.eyebrow}</p>
            <h1 className={styles.display}>{AUDIO_GUIDE.title}</h1>
            <p className={`${styles.spaceProse} ${styles.gap1}`}>{AUDIO_GUIDE.standfirst}</p>
          </Col>
        </Row>

        {TRACKS.map((track) => (
          <Row key={track.file} className={styles.gap2}>
            <Col from={2} span={8} narrow>
              <h2 className={styles.trackTitle}>{track.title}</h2>
              <audio className={styles.audio} controls preload="none">
                <source src={EVENT_FILES[track.file].src} type="audio/mp4" />
              </audio>
              <details className={styles.transcript}>
                <summary>Transcript</summary>
                <div className={styles.transcriptBody}>
                  {track.transcript.map((line) => (
                    <p key={line.slice(0, 40)}>{line}</p>
                  ))}
                </div>
              </details>
            </Col>
          </Row>
        ))}

        <Row wide className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{AUDIO_GUIDE.creditsHeading}</p>
            <div className={`${styles.credit} ${styles.gap1}`}>
              {AUDIO_GUIDE.credits.map((c) => (
                <div key={c.role}>
                  {c.role}: <span className={styles.strong}>{c.names}</span>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
