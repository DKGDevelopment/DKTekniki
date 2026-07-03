"use client";

// TODO: WebGL globe — this is the canvas-2D fallback pass. Swap for an
// OGL/raw-WebGL particle sphere when upgrading the hero visual.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const MAX_PARTICLES = 7000;
const ROTATION_SPEED = 0.0038;
const AXIS_TILT = -0.28; // radians, tips the globe like a planet

// Blue-white palette, weighted toward the pale tones
const PALETTE = [
  "255, 255, 255",
  "233, 240, 255",
  "169, 196, 255",
  "126, 155, 255",
  "91, 121, 227",
];

// Light comes from the top-right-front, matching the reference highlight
const LIGHT = { x: 0.5, y: -0.65, z: 0.57 };

type Particle = {
  x: number;
  y: number;
  z: number;
  size: number; // 0.5–2.4 relative dot size
  color: number; // palette index
  twinkle: number; // phase offset for subtle shimmer
};

function buildParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    // Jitter the shell slightly so the surface reads organic, not gridded
    const shell = 0.94 + Math.random() * 0.08;
    particles.push({
      x: Math.cos(theta) * radius * shell,
      y: y * shell,
      z: Math.sin(theta) * radius * shell,
      size: 0.5 + Math.random() * Math.random() * 1.9,
      color: Math.min(
        PALETTE.length - 1,
        Math.floor(Math.random() * Math.random() * PALETTE.length)
      ),
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

// Pre-render one soft glow sprite per palette color; drawImage is far
// cheaper than per-dot arc + gradient at this particle count.
function buildSprites(): HTMLCanvasElement[] {
  const SPRITE = 32;
  return PALETTE.map((rgb) => {
    const c = document.createElement("canvas");
    c.width = SPRITE;
    c.height = SPRITE;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(
      SPRITE / 2,
      SPRITE / 2,
      0,
      SPRITE / 2,
      SPRITE / 2,
      SPRITE / 2
    );
    grad.addColorStop(0, `rgba(${rgb}, 1)`);
    grad.addColorStop(0.35, `rgba(${rgb}, 0.85)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    return c;
  });
}

type ParticleGlobeProps = {
  /** 0 → hero at rest, 1 → fully zoomed into the constellation */
  progress: MotionValue<number>;
};

export default function ParticleGlobe({ progress }: ParticleGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Density scales with viewport so phones draw a fraction of the dots
    const area = canvas.clientWidth * canvas.clientHeight;
    const particles = buildParticles(
      Math.min(MAX_PARTICLES, Math.max(1200, Math.floor(area / 190)))
    );
    const sprites = buildSprites();
    const cosTilt = Math.cos(AXIS_TILT);
    const sinTilt = Math.sin(AXIS_TILT);
    let rotation = 0;
    let time = 0;
    let rafId = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      // Soft glow sprites don't need retina sharpness; 1.5 keeps fill cheap
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const p = reduceMotion ? 0 : progress.get();
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      // Zoom: sphere radius grows from ~40% of viewport to well past it.
      const baseRadius = Math.min(width, height) * 0.4;
      const radius = baseRadius * (1 + p * 3.2);
      const fade = 1 - Math.max(0, (p - 0.55) / 0.45); // dissolve near the end
      if (fade <= 0.01) return;
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const perspective = 3;

      for (const particle of particles) {
        // Spin around Y, then tilt the whole axis around Z
        const rx = particle.x * cosR - particle.z * sinR;
        const z = particle.x * sinR + particle.z * cosR;
        const x = rx * cosTilt - particle.y * sinTilt;
        const y = rx * sinTilt + particle.y * cosTilt;

        const scale = perspective / (perspective + z);
        const px = cx + x * radius * scale;
        const py = cy + y * radius * scale;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        const depth = (1 - z) / 2; // 0 back → 1 front
        // Lambert-ish shading toward the light direction
        const lit = Math.max(0, x * LIGHT.x + y * LIGHT.y + z * LIGHT.z);
        const shimmer = reduceMotion
          ? 1
          : 0.85 + 0.15 * Math.sin(time * 1.4 + particle.twinkle);
        const alpha =
          (0.18 + depth * 0.42 + lit * 0.55) * shimmer * fade;
        if (alpha <= 0.02) continue;

        const size = (1.1 + lit * 1.3) * particle.size * scale;
        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.drawImage(
          sprites[particle.color],
          px - size,
          py - size,
          size * 2,
          size * 2
        );
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) {
        rotation += ROTATION_SPEED;
        time += 1 / 60;
      }
    };

    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(rafId);
      if (visible && !reduceMotion) {
        rafId = requestAnimationFrame(loop);
      } else if (visible) {
        draw();
      }
    });

    resize();
    draw();
    observer.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
