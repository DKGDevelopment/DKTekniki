import FadeUp from "./FadeUp";
import styles from "./TrustRow.module.css";

const COLUMNS = [
  {
    title: "Licensed & certified",
    body: "Chartered architects and engineers, registered and insured for every discipline we deliver.",
    chips: ["Technical Chamber (TEE)", "ISO 9001"],
  },
  {
    title: "Built to code",
    body: "Full compliance with Eurocodes and national energy regulations, engineered in from the first drawing.",
    chips: ["Eurocodes", "KENAK", "Energy Class A"],
  },
  {
    title: "End-to-end delivery",
    body: "Permits, engineering, site supervision and handover managed under one roof, on one schedule.",
    chips: ["Permitting", "Site Supervision"],
  },
];

export default function TrustRow() {
  return (
    <div className={styles.row}>
      {COLUMNS.map((column, i) => (
        <FadeUp key={column.title} delay={i * 0.05} className={styles.column}>
          <h3 className={styles.title}>{column.title}</h3>
          <p className={styles.body}>{column.body}</p>
          <div className={styles.chips}>
            {column.chips.map((chip) => (
              <span key={chip} className={styles.chip}>
                {chip}
              </span>
            ))}
          </div>
          <a href="#open" className={styles.readMore}>
            Read More <span aria-hidden="true">→</span>
          </a>
        </FadeUp>
      ))}
    </div>
  );
}
