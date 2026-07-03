"use client";

// Slowly rotating 3D sphere of project badges, orbiting the centered
// constellation heading (Morpho-style). Each badge tries to load
// /projects/NN.jpg (01–36); until an image exists it shows initials.

import { useEffect, useRef, useState } from "react";
import styles from "./ProjectSphere.module.css";

const COUNT = 36;
const ROTATION_SPEED = 0.0022; // radians per frame around Y

const PROJECT_NAMES = [
  "Elite Living",
  "Piraeus Gate",
  "IMERAS",
  "Wyndham Mediterranean",
  "New Age Living",
  "Nuvia Urban Stay",
  "B-48",
];

function initialsFor(index: number) {
  const name = PROJECT_NAMES[index % PROJECT_NAMES.length];
  return name
    .split(/[\s-]+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// Even sphere distribution, with the equator band pushed apart so the
// badges orbit around the heading instead of crossing it
function buildSpherePoints(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const spread = Math.sign(y) * (0.3 + 0.7 * Math.abs(y));
    return {
      x: Math.cos(theta) * radius,
      y: spread,
      z: Math.sin(theta) * radius,
    };
  });
}

function Badge({ index }: { index: number }) {
  // Initials show until the project image actually loads, so missing
  // images never flash a broken-image icon
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = `/projects/${String(index + 1).padStart(2, "0")}.jpg`;

  return (
    <>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          style={loaded ? undefined : { display: "none" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && (
        <span className={styles.initials}>{initialsFor(index)}</span>
      )}
    </>
  );
}

export default function ProjectSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const points = buildSpherePoints(COUNT);
    let rotation = 0;
    let rafId = 0;
    let rx = 0;
    let ry = 0;

    const resize = () => {
      rx = container.clientWidth * 0.44;
      ry = container.clientHeight * 0.42;
    };

    const apply = () => {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      for (let i = 0; i < COUNT; i++) {
        const el = badgeRefs.current[i];
        if (!el) continue;
        const point = points[i];
        const x = point.x * cos + point.z * sin;
        const z = -point.x * sin + point.z * cos;
        const depth = (z + 1) / 2; // 0 back → 1 front
        const scale = 0.45 + 0.55 * depth;
        el.style.transform = `translate3d(${x * rx}px, ${point.y * ry}px, 0) scale(${scale})`;
        el.style.opacity = String(0.25 + 0.75 * depth);
        el.style.zIndex = String(Math.round(depth * 10));
      }
    };

    const loop = () => {
      rotation += ROTATION_SPEED;
      apply();
      rafId = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(rafId);
      if (entry.isIntersecting && !reduceMotion) {
        rafId = requestAnimationFrame(loop);
      }
    });

    resize();
    apply();
    observer.observe(container);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.sphere} aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            badgeRefs.current[i] = el;
          }}
          className={styles.badge}
        >
          <Badge index={i} />
        </div>
      ))}
    </div>
  );
}
