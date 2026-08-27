import type { Metadata } from "next";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { EventsNav } from "@/components/events/EventsNav";
import { Col, Row } from "@/components/events/Grid";
import PhotoGallery from "@/components/events/PhotoGallery";
import { HONK_PHOTOS } from "@/components/events/events-data";
import styles from "@/app/Events/events.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Photographs — Honk, Please! — Napkins",
  description: "Twenty-five photographs of Honk, Please! by Mona Westphal.",
  alternates: { canonical: "/Events/honk-please/photos" },
};

/**
 * Mona Westphal's photographs of Honk, Please!
 *
 * On black, which is how the original was — Cargo's page_options for this page
 * set page_container_bgcolor to #000 while every other page in the section is
 * white. It is the one room in the section with the lights off, and it suits a
 * wall of photographs.
 */
export default function HonkPhotosPage() {
  return (
    <div className={`${styles.page} ${styles.photosPage} ${averia.variable} ${inter.variable}`}>
      <div className={styles.act}>
        <EventsNav />

        <Row wide className={styles.breadcrumbRow}>
          <Col from={2} span={10}>
            <Link href="/Events#honk" className={styles.breadcrumb}>
              Honk, Please!
            </Link>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={10}>
            <h1 className={styles.display}>{HONK_PHOTOS.title}</h1>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={10}>
            <PhotoGallery photos={HONK_PHOTOS.photos} />
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={10}>
            <p className={styles.credit}>{HONK_PHOTOS.credit}</p>
          </Col>
        </Row>
      </div>
    </div>
  );
}
