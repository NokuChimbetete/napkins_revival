import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { EventsNav } from "@/components/events/EventsNav";
import { Col, Figure, Row } from "@/components/events/Grid";
import MontessoriGallery from "@/components/events/MontessoriGallery";
import { SPACES } from "@/components/events/spaces-data";
import styles from "@/app/Events/events.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export function generateStaticParams() {
  return SPACES.map((space) => ({ space: space.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ space: string }>;
}): Promise<Metadata> {
  const { space: slug } = await params;
  const space = SPACES.find((s) => s.slug === slug);
  if (!space) return {};
  return {
    title: `${space.title} — Fractal — Napkins`,
    description: space.lede[0],
    alternates: { canonical: `/Events/fractal/${space.slug}` },
  };
}

/**
 * One of Fractal's six spaces.
 *
 * Six pages rather than six sections of one, because each carries a
 * description, a materials list, a designer credit and its own pile of
 * photographs — and because a drag-to-move gallery inside a dismissible
 * overlay is a trap, where half the drags would close the thing being dragged.
 * They also keep the six addresses the old site already published.
 *
 * These pages have no wallpaper: on Cargo they used the site default rather
 * than a backdrop of their own, so they are black on white and the exhibition's
 * dark world is left behind at /Events#fractal.
 */
export default async function SpacePage({ params }: { params: Promise<{ space: string }> }) {
  const { space: slug } = await params;
  const index = SPACES.findIndex((s) => s.slug === slug);
  if (index === -1) notFound();

  const space = SPACES[index];
  // the six link in a loop — the last one's "next" is the first one again
  const previous = SPACES[(index - 1 + SPACES.length) % SPACES.length];
  const next = SPACES[(index + 1) % SPACES.length];

  return (
    <div className={`${styles.page} ${styles.spacePage} ${averia.variable} ${inter.variable}`}>
      <div className={styles.act}>
        <EventsNav />

        <Row wide className={styles.breadcrumbRow}>
          <Col from={2} span={10}>
            <Link href="/Events#fractal" className={styles.breadcrumb}>
              Fractal
            </Link>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={10} className={styles.alignCentre}>
            <h1 className={styles.spaceTitle}>{space.title}</h1>
            <div className={`${styles.spaceLede} ${styles.gap1}`}>
              {space.lede.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={10}>
            <Figure
              image={space.hero.image}
              alt={space.hero.alt}
              sizes="(max-width: 700px) 92vw, 80vw"
              priority
            />
          </Col>
        </Row>

        {space.rows.map((row, i) => {
          if (row.kind === "prose") {
            return (
              <Row wide key={i} className={styles.gap2}>
                <Col from={2} span={10}>
                  {row.heading && <p className={styles.strong}>{row.heading}</p>}
                  <div className={styles.spaceProse}>
                    {row.text.map((p) => (
                      <p key={p.slice(0, 32)}>{p}</p>
                    ))}
                  </div>
                </Col>
              </Row>
            );
          }

          if (row.kind === "columns") {
            return (
              <Row wide key={i} className={styles.gap2}>
                {[row.left, row.right].map((cell, side) => (
                  <Col key={side} from={side === 0 ? 2 : undefined} span={5}>
                    {cell.pictures?.map((picture) => (
                      <Figure
                        key={picture.image}
                        image={picture.image}
                        alt={picture.alt}
                        sizes="(max-width: 700px) 92vw, 40vw"
                        className={styles.stackedPicture}
                      />
                    ))}
                    {cell.text && (
                      <div className={`${styles.spaceProse} ${cell.pictures ? styles.gap1 : ""}`}>
                        {cell.text.map((p) => (
                          <p key={p.slice(0, 32)}>{p}</p>
                        ))}
                      </div>
                    )}
                  </Col>
                ))}
              </Row>
            );
          }

          return (
            <Row wide key={i} className={styles.gap2}>
              <Col from={2} span={10}>
                <MontessoriGallery height={row.height} items={row.items} verse={row.verse} />
              </Col>
            </Row>
          );
        })}

        <Row wide className={styles.gap2}>
          <Col from={2} span={10}>
            <p className={styles.materials}>Materials - {space.materials}</p>
            <p className={`${styles.designer} ${styles.alignRight}`}>designed by {space.designer}</p>
          </Col>
        </Row>

        <Row wide className={`${styles.gap2} ${styles.spaceNav}`}>
          <Col from={2} span={5}>
            <Link href={`/Events/fractal/${previous.slug}`} className={styles.linkOut}>
              ← previous space
            </Link>
          </Col>
          <Col span={5} className={styles.alignRight}>
            <Link href={`/Events/fractal/${next.slug}`} className={styles.linkOut}>
              next space →
            </Link>
          </Col>
        </Row>
      </div>
    </div>
  );
}
