import FadeUp from "./FadeUp";
import styles from "./InvestorGrid.module.css";

const INVESTORS = [
  "Northlight Capital",
  "Aegis Ventures",
  "Blue Harbor",
  "Meridian Fund",
  "Copperfield",
  "Atlas Partners",
  "Ionian Growth",
  "Summit Row",
  "Fjord Capital",
  "Argo Ventures",
  "Lumen Equity",
];

export default function InvestorGrid() {
  return (
    <FadeUp>
      <div className={styles.grid}>
        {INVESTORS.map((name) => (
          <div key={name} className={styles.cell}>
            <span className={styles.logo}>
              <span className={styles.logoMark} aria-hidden="true" />
              {name}
            </span>
          </div>
        ))}
        <div className={styles.cell}>
          <a href="#cta" className={styles.viewMore}>
            View More <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </FadeUp>
  );
}
