import styles from "./Logo.module.css";

/* Vector recreation of the DK Techniki brand assets (sima.png +
   text.png): three diagonal stripes and the letter-spaced wordmark. */

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className={styles.mark}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 22 L52 8 L52 17 L12 31 Z" fill="currentColor" />
      <path d="M12 36 L52 22 L52 31 L12 45 Z" fill="currentColor" />
      <path d="M12 50 L52 36 L52 45 L12 59 Z" fill="currentColor" />
    </svg>
  );
}

type LogoProps = {
  size?: number;
  tagline?: boolean;
};

export default function Logo({ size = 32, tagline = false }: LogoProps) {
  return (
    <span className={styles.logo}>
      <LogoMark size={size} />
      <span className={styles.lockup}>
        <span className={styles.name}>DK Techniki</span>
        {tagline && <span className={styles.tagline}>Building Innovation</span>}
      </span>
    </span>
  );
}
