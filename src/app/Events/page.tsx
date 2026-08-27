import type { Metadata } from "next";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import ActStage from "@/components/events/ActStage";
import { Col, Figure, Row, ScrollCue } from "@/components/events/Grid";
import { EVENT_FILES } from "@/components/events/event-images";
import { BORDE, CHIMERA, FRACTAL, HONK } from "@/components/events/events-data";
import { SPACE_LINKS } from "@/components/events/spaces-data";
import styles from "./events.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Events — Napkins",
  description:
    "Four interactive exhibitions: Fractal in Taipei, Honk, Please! in Hyderabad, Borde_ in Buenos Aires, and Chimera in Berlin.",
  alternates: { canonical: "/Events" },
};

/**
 * The four exhibitions as one scroll.
 *
 * On the old Cargo site this was five pages — an index and one page each — and
 * the four looked nothing like one another on purpose: they are four different
 * exhibitions, not four pages of one thing. What holds them together here is
 * not making them look alike. It is that every one of them opens with the same
 * frame at the same measure and the same rhythm, and that the page underneath
 * is white throughout. Only the artwork on the right and the ink change.
 *
 * The seam that needed real work is Fractal into Honk: a darkened photograph
 * into a white page. It is handled by getting out of the way — Fractal ends
 * with a screen of empty space (.actTail) so its white text is gone before the
 * wallpaper underneath turns white, and the change itself is the stage's
 * cross-fade with nothing painted on top of it. Every other seam is one crayon
 * drawing fading into another over the same white field, which needs nothing.
 */
export default function EventsPage() {
  const video = EVENT_FILES["fractal/lungs-video"];

  return (
    <div className={`${styles.page} ${averia.variable} ${inter.variable}`}>
      <ActStage />

      {/* ================================================================== 1 */}
      <section id="fractal" data-act-section="fractal" className={`${styles.act} ${styles.actFractal}`}>
        <div className={styles.opener}>
          <Row>
            <Col from={2} span={10}>
              {/* "Events" is the breadcrumb on the original Fractal page. With the
                  four exhibitions on one page there is nowhere for it to link, so
                  it stays as a label — and it is the <h1>, since it names the page
                  and the exhibition titles below it are its sections. The same
                  move /About-Us makes with its own "About Us". */}
              <h1 className={styles.breadcrumb}>Events</h1>
              <h2 className={`${styles.display} ${styles.displayLight}`}>{FRACTAL.title}</h2>
              <p className={`${styles.meta} ${styles.openerMeta}`}>
                {FRACTAL.place}
                <br />
                {FRACTAL.date}
              </p>
            </Col>
          </Row>
          <ScrollCue />
        </div>

        <Row className={styles.gap3}>
          <Col from={2} span={10} className={styles.alignCentre}>
            <p className={styles.strong}>{FRACTAL.lede}</p>
            <div className={`${styles.prose} ${styles.gap1}`}>
              {FRACTAL.intro.map((line, i) =>
                line === "" ? <br key={i} /> : <div key={i}>{line}</div>,
              )}
            </div>
          </Col>
        </Row>

        {/* grid-col="x12" on the original: full width, outside the page padding */}
        <div className={styles.videoRow}>
          <video
            className={styles.video}
            controls
            preload="metadata"
            playsInline
            poster={video.poster}
            width={1280}
            height={853}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        </div>

        <Row className={styles.gap2}>
          <Col from={2} span={10}>
            <p className={styles.strong}>{FRACTAL.spacesHeading}</p>
            <ul className={`${styles.spaceList} ${styles.gap1}`}>
              {SPACE_LINKS.map((space) => (
                <li key={space.slug} className={styles.spaceItem}>
                  <Link href={`/Events/fractal/${space.slug}`} className={styles.spaceLink}>
                    <Figure
                      image={space.image}
                      alt=""
                      sizes="(max-width: 700px) 45vw, 16vw"
                      className={styles.spaceThumb}
                    />
                    <span className={styles.spaceName}>
                      {SPACE_TITLES[space.slug]}
                      <span className={styles.spaceBlurb}>: {space.blurb}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Col>
        </Row>

        {/* Fractal's last screen: empty, so its white text is gone before the
            wallpaper underneath turns white. */}
        <div className={styles.actGap} />
      </section>

      {/* The handover, and the reason it sits between the two sections rather
          than inside either: it is marked as Honk, so the wallpaper changes
          here — over an empty screen — instead of waiting until Honk's title
          is already arriving and reading black-on-dark for the length of the
          fade. Every observed element has to be disjoint from the others or
          scrolling back up leaves the wrong one active, which is why this is a
          sibling and not a child. */}
      <div className={styles.actTail} data-act-section="honk" />

      {/* ================================================================== 2 */}
      <section id="honk" data-act-section="honk" className={`${styles.act} ${styles.actHonk}`}>
        <div className={styles.opener}>
          <Row>
            <Col from={2} span={6} narrow>
              <p className={styles.eyebrow}>{HONK.eyebrow}</p>
              <h2 className={styles.display}>{HONK.title}</h2>
              <p className={`${styles.meta} ${styles.openerMeta}`}>
                {HONK.place}
                <br />
                {HONK.date}
              </p>
            </Col>
          </Row>
        </div>

        <Row className={styles.gap2}>
          <Col from={2} span={5} narrow>
            <h3 className={styles.lede}>{HONK.lede}</h3>
            <div className={styles.prose}>
              {HONK.intro.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
              <hr className={styles.rule} />
              {HONK.introAfterRule.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{HONK.floorPlan.heading}</p>
            <Figure
              image={HONK.floorPlan.image}
              alt={HONK.floorPlan.alt}
              sizes="(max-width: 700px) 92vw, 48vw"
              className={styles.gap1}
            />
          </Col>
        </Row>

        {HONK.zones.map((zone) => (
          <Row key={zone.number} className={styles.gap2}>
            <Col from={2} span={3} narrow>
              <p className={styles.strong}>
                {zone.number} {zone.name}
              </p>
              <div className={`${styles.prose} ${styles.gap1}`}>
                {zone.body.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
                {zone.design && (
                  <p>
                    <span className={styles.strong}>Design</span>:{" "}
                    {zone.design.map((line, i) => (
                      <span key={line}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </p>
                )}
                {zone.materials && (
                  <p>
                    <span className={styles.strong}>Materials</span>: {zone.materials}
                  </p>
                )}
                <p>
                  <span className={styles.strong}>Designer</span>: {zone.designer}
                </p>
              </div>
            </Col>
            <Col span={3} className={zone.centred ? styles.alignCentre : undefined}>
              {zone.pictures.map((picture) => (
                <Figure
                  key={picture.image}
                  image={picture.image}
                  alt={picture.alt}
                  sizes="(max-width: 700px) 92vw, 25vw"
                  className={styles.zonePicture}
                />
              ))}
            </Col>
          </Row>
        ))}

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <Link href="/Events/honk-please/photos" className={styles.linkOut}>
              → {HONK.photosLink}
            </Link>
          </Col>
        </Row>
      </section>

      {/* ================================================================== 3 */}
      <section id="borde" data-act-section="borde" className={`${styles.act} ${styles.actBorde}`}>
        <div className={styles.opener}>
          <Row>
            <Col from={2} span={6} narrow>
              <p className={styles.eyebrow}>{BORDE.eyebrow}</p>
              <h2 className={styles.display}>{BORDE.title}</h2>
              <p className={`${styles.meta} ${styles.openerMeta}`}>
                {BORDE.place}
                <br />
                {BORDE.date}
              </p>
            </Col>
          </Row>
        </div>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <h3 className={styles.lede}>{BORDE.lede}</h3>
            <div className={styles.prose}>
              {BORDE.intro.map((p) => (
                <p key={p.slice(0, 32)}>{emphasise(p)}</p>
              ))}
            </div>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{BORDE.walkthrough.heading}</p>
            <div className={`${styles.embed} ${styles.gap1}`}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${BORDE.walkthrough.youtubeId}`}
                title={BORDE.walkthrough.title}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{BORDE.creditsHeading}</p>
          </Col>
        </Row>
        <Row wide className={styles.gap1}>
          <Col from={2} span={5} narrow>
            <div className={styles.credit}>
              {BORDE.credits.map((c) => (
                <div key={c.role}>
                  {c.role}: <span className={styles.strong}>{c.names}</span>
                </div>
              ))}
              <p className={`${styles.eyebrow} ${styles.gap1}`}>{BORDE.thanksHeading}</p>
              {BORDE.thanks.map((name) => (
                <div key={name}>{name}</div>
              ))}
            </div>
          </Col>
        </Row>
      </section>

      {/* ================================================================== 4 */}
      <section id="chimera" data-act-section="chimera" className={`${styles.act} ${styles.actChimera}`}>
        <div className={styles.opener}>
          <Row>
            <Col from={2} span={6} narrow>
              <p className={styles.eyebrow}>{CHIMERA.eyebrow}</p>
              <h2 className={styles.display}>{CHIMERA.title}</h2>
              <p className={`${styles.meta} ${styles.openerMeta}`}>
                {CHIMERA.place}
                <br />
                {CHIMERA.date}
              </p>
              <Figure
                image={CHIMERA.lockup.image}
                alt={CHIMERA.lockup.alt}
                sizes="(max-width: 700px) 60vw, 20vw"
                className={styles.gap1}
              />
            </Col>
          </Row>
        </div>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <h3 className={styles.lede}>{CHIMERA.lede}</h3>
            <div className={styles.prose}>
              {CHIMERA.intro.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
            <p className={`${styles.strong} ${styles.gap1}`}>{CHIMERA.diaspora.heading}</p>
            <div className={`${styles.prose} ${styles.gap1}`}>
              <p>{CHIMERA.diaspora.body}</p>
            </div>
            <p className={`${styles.credit} ${styles.alignRight}`}>{CHIMERA.diaspora.byline}</p>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{CHIMERA.audioGuide.heading}</p>
            <div className={`${styles.prose} ${styles.gap1}`}>
              <p>
                Who is Chimera? Why are we here? Listen to the{" "}
                <Link href="/Events/chimera/audio-guide">audio guide</Link>.
              </p>
            </div>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{CHIMERA.teamHeading}</p>
            <div className={`${styles.prose} ${styles.gap1}`}>
              {CHIMERA.teamIntro.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={6} className={styles.teamCol}>
            <ul className={styles.teamGrid}>
              {CHIMERA.team.map((person) => (
                <li key={person.email} className={styles.teamCell}>
                  <Figure
                    image={person.image}
                    alt=""
                    sizes="(max-width: 700px) 45vw, 17vw"
                    className={styles.teamPhoto}
                  />
                  <p className={styles.teamName}>
                    {person.name} {person.flag} ({person.pronouns})
                  </p>
                  <p className={styles.teamRole}>
                    {person.roles.map((role, i) => (
                      <span key={role}>
                        {i > 0 && <br />}
                        {role}
                      </span>
                    ))}
                  </p>
                  <a
                    href={`mailto:${person.email}`}
                    className={styles.teamMail}
                    aria-label={`Email ${person.name}`}
                  >
                    <Envelope />
                  </a>
                </li>
              ))}
            </ul>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={5} narrow>
            <p className={styles.eyebrow}>{CHIMERA.thanksHeading}</p>
            <div className={`${styles.credit} ${styles.gap1}`}>
              {CHIMERA.thanks.map((t) => (
                <div key={t.name}>
                  <span className={styles.strong}>{t.name}</span>, {t.for}
                </div>
              ))}
            </div>
          </Col>
        </Row>

        <Row className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <p className={styles.strong}>{CHIMERA.partner.heading}</p>
            <div className={`${styles.prose} ${styles.gap1}`}>
              <p>
                <a href={CHIMERA.partner.href} target="_blank" rel="noreferrer">
                  Migrant Bird Space
                </a>{" "}
                {CHIMERA.partner.body[0].replace("Migrant Bird Space ", "")}
              </p>
              <p>{CHIMERA.partner.body[1]}</p>
            </div>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={6} narrow>
            <h3 className={styles.display}>{CHIMERA.contact.heading}</h3>
            <p className={`${styles.strong} ${styles.gap1}`}>
              <a
                href={`https://instagram.com/${CHIMERA.contact.instagram}`}
                target="_blank"
                rel="noreferrer"
              >
                @{CHIMERA.contact.instagram}
              </a>
              <br />
              <a href={`mailto:${CHIMERA.contact.email}`}>{CHIMERA.contact.email}</a>
            </p>
          </Col>
        </Row>

        <Row wide className={styles.gap2}>
          <Col from={2} span={7}>
            <p className={`${styles.credit} ${styles.alignRight} ${styles.colophon}`}>
              {CHIMERA.colophon.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </Col>
        </Row>
      </section>
    </div>
  );
}

/** Cargo drew this with a private-use glyph (U+E0F1) from its own icon font,
 *  which renders as nothing without it. */
function Envelope() {
  return (
    <svg viewBox="0 0 24 16" fill="none" aria-hidden="true" focusable="false">
      <rect x="0.7" y="0.7" width="22.6" height="14.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 1.4 12 9 23 1.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Titles for the Explore Spaces list, kept next to the page that uses them so
 *  spaces-data.ts stays about the spaces themselves. */
const SPACE_TITLES: Record<string, string> = {
  lungs: "Lungs",
  waves: "Waves",
  engine: "Engine",
  web: "Web",
  "golden-ratio": "Golden Ratio",
  synergy: "Synergy Arts Workshop",
};

/** Borde_'s intro italicises the Spanish word *borde* four times. The data file
 *  marks it with asterisks so an editor never has to write a tag. */
function emphasise(text: string) {
  return text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
