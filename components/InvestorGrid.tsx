import FadeUp from "./FadeUp";
import styles from "./InvestorGrid.module.css";

/* Placeholder partner names — replace with the real collaborator and
   supplier network when confirmed. */
const PARTNERS = [
  "Domiki Engineering",
  "Meltemi MEP",
  "Aegean Contractors",
  "Lithos Stoneworks",
  "Fos Lighting Studio",
  "Verde Landscapes",
  "Krystal Glazing",
  "Attika Surveying",
  "Thermo Energy",
  "Nomos Planning",
  "Ergon Steelworks",
];

export default function InvestorGrid() {
  return (
    <FadeUp>
      <div className={styles.grid}>
        {PARTNERS.map((name) => (
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
