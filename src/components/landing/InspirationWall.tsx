import Image from "next/image";
import { WALL_ROWS } from "./collage-data";
import styles from "./landing.module.css";

export function InspirationWall() {
  return (
    <div className={styles.wall}>
      <div className={styles.wallTear} />
      <div className={styles.veil} />
      {WALL_ROWS.map((row, r) => (
        <div key={r} className={styles.wallRow}>
          {row.tiles.map((tile, i) => (
            <div
              key={i}
              className={styles.tile}
              style={{ flex: `${tile.flex} 1 0%`, height: row.height }}
            >
              <Image src={tile.src} alt={tile.alt} fill sizes="12vw" className={styles.tileImg} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
