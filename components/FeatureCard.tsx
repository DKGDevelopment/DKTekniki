import Button from "./Button";
import FadeUp from "./FadeUp";
import styles from "./FeatureCard.module.css";

export type Feature = {
  title: string;
  body: string;
  customers: string[];
  visual: "grid" | "orbit" | "stack";
};

function Visual({ variant }: { variant: Feature["visual"] }) {
  if (variant === "grid") {
    return (
      <svg viewBox="0 0 200 150" fill="none" role="img" aria-label="Abstract grid illustration">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={20 + (i % 4) * 42}
            y={20 + Math.floor(i / 4) * 40}
            width="30"
            height="28"
            rx="6"
            fill={i === 5 ? "#7E9BFF" : "rgba(255,255,255,0.12)"}
          />
        ))}
      </svg>
    );
  }
  if (variant === "orbit") {
    return (
      <svg viewBox="0 0 200 150" fill="none" role="img" aria-label="Abstract orbit illustration">
        <circle cx="100" cy="75" r="55" stroke="rgba(255,255,255,0.15)" />
        <circle cx="100" cy="75" r="34" stroke="rgba(255,255,255,0.25)" />
        <circle cx="100" cy="75" r="12" fill="#3D5AF1" />
        <circle cx="155" cy="75" r="7" fill="#7E9BFF" />
        <circle cx="70" cy="46" r="5" fill="rgba(255,255,255,0.4)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 150" fill="none" role="img" aria-label="Abstract stack illustration">
      <rect x="45" y="94" width="110" height="22" rx="8" fill="rgba(255,255,255,0.10)" />
      <rect x="55" y="64" width="90" height="22" rx="8" fill="rgba(255,255,255,0.20)" />
      <rect x="65" y="34" width="70" height="22" rx="8" fill="#7E9BFF" />
    </svg>
  );
}

export default function FeatureCard({
  feature,
  reversed,
}: {
  feature: Feature;
  reversed: boolean;
}) {
  return (
    <FadeUp>
      <article
        className={`${styles.card} ${reversed ? styles.reversed : ""}`}
      >
        <div className={styles.visual}>
          <Visual variant={feature.visual} />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{feature.title}</h3>
          <p className={styles.body}>{feature.body}</p>

          <div className={styles.marquee}>
            <div className={styles.marqueeTrack}>
              {[...feature.customers, ...feature.customers].map((name, i) => (
                <span key={`${name}-${i}`} className={styles.logoTile}>
                  {name}
                  <span className={styles.logoTileArrow} aria-hidden="true">
                    ↗
                  </span>
                </span>
              ))}
            </div>
          </div>

          <Button href="#open" variant="ghost" arrow="↗">
            Read more
          </Button>
        </div>
      </article>
    </FadeUp>
  );
}
