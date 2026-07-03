import styles from "./Logo.module.css";

/* Official DK Techniki symbol, inlined from public/brand/sima.svg
   (viewBox cropped to the mark). Two-tone isometric geometry:
   white left faces, grey right faces. */

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className={styles.mark}
      width={size}
      height={size}
      viewBox="27.2 26.9 49.9 54.5"
      fill="none"
      aria-hidden="true"
    >
      <polygon fill="#FFFFFF" points="41.2,51.1 52,57.8 52,52.1 41.1,45.5" />
      <polygon fill="#B3B3B3" points="75.1,45 52,57.8 52,52.1 75.1,39.3" />
      <polygon fill="#FFFFFF" points="41.2,61.9 52,68.6 52,62.9 41.1,56.3" />
      <polygon fill="#B3B3B3" points="75.1,55.7 52,68.6 52,62.9 75.1,50.1" />
      <polygon fill="#FFFFFF" points="41.2,72.7 52,79.4 52,73.7 41.1,67.1" />
      <polygon fill="#B3B3B3" points="75.1,66.5 52,79.4 52,73.7 75.1,60.9" />
      <polygon
        fill="#FFFFFF"
        points="33.7,69.5 33.7,44.2 52,34.3 65.3,41.6 70,38.7 52,28.9 29.2,41.2 29.2,66.6"
      />
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
