import Image from "next/image";
import { STRIP_TILES } from "./collage-data";
import styles from "./landing.module.css";

export function VintageStrip() {
  return (
    <div className={styles.strip}>
      <div className={styles.stripTear} />
      <div className={styles.veil} />
      {STRIP_TILES.map((tile, i) => (
        <div key={i} className={styles.tile} style={{ flex: `${tile.flex} 1 0%` }}>
          <Image src={tile.src} alt={tile.alt} fill sizes="8vw" className={styles.tileImg} />
        </div>
      ))}
    </div>
  );
}
