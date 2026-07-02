import FadeUp from "./FadeUp";
import styles from "./TrustRow.module.css";

const COLUMNS = [
  {
    title: "Audits",
    body: "Independently audited by leading security firms, with every report published in full.",
    chips: ["SecureLab", "AuditWorks", "TrailGuard"],
  },
  {
    title: "Verification",
    body: "Formally verified core, with continuous fuzzing and public bug bounties.",
    chips: ["FormalCheck", "FuzzNet"],
  },
  {
    title: "Institutional",
    body: "Compliance-ready controls and SLAs trusted by regulated enterprises.",
    chips: ["ISO 27001", "SOC 2"],
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
