import styles from "./landing.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLeft}>
        <a href="mailto:napkinsmag@gmail.com" className={styles.footerEmail}>
          napkinsmag@gmail.com
        </a>
        <div className={styles.footerSocials}>
          <a
            href="https://www.instagram.com/napkinseverywhere"
            aria-label="Instagram"
            className={styles.footerIcon}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="17.6" cy="6.4" r="1.4" fill="currentColor" />
            </svg>
          </a>
          <a href="#" aria-label="LinkedIn" className={styles.footerLinkedin}>
            in
          </a>
        </div>
      </div>
      <div className={styles.footerCopyright}>©2026 Napkins</div>
    </footer>
  );
}
