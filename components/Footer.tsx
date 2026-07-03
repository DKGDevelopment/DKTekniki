import Logo from "./Logo";
import styles from "./Footer.module.css";

const COLUMNS: Record<string, string[]> = {
  Products: ["Build", "Deploy", "Monitor", "Pricing"],
  Resources: ["Documentation", "Blog", "Changelog", "Status"],
  Company: ["About", "Careers", "Press", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Licenses"],
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <Logo size={40} tagline />

          <div className={styles.columns}>
            {Object.entries(COLUMNS).map(([head, links]) => (
              <nav key={head} aria-label={head}>
                <h3 className={styles.columnHead}>{head}</h3>
                {links.map((link) => (
                  <a key={link} href="#" className={styles.link}>
                    {link}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className={styles.wordmark} aria-hidden="true">
          DK Techniki
        </div>
      </div>
    </footer>
  );
}
