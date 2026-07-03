"use client";

// TODO: WebGL globe — this is the canvas-2D fallback pass. Swap for an
// OGL/raw-WebGL particle sphere when upgrading the hero visual.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const MAX_PARTICLES = 21000;
const ROTATION_SPEED = 0.0038;
const AXIS_TILT = -0.28; // radians, tips the globe like a planet

// Color ramp endpoints: white ↔ electric blue. Each particle drifts
// back and forth along this ramp continuously.
const RAMP_FROM = { r: 255, g: 255, b: 255 };
const RAMP_TO = { r: 61, g: 122, b: 255 };
const RAMP_STEPS = 9;

// Light comes from the top-right-front, matching the reference highlight
const LIGHT = { x: 0.5, y: -0.65, z: 0.57 };

// Cursor spotlight: dots within this screen radius brighten, grow and
// gather toward the pointer
const POINTER_RADIUS = 210;
const POINTER_EASE = 0.12;
const GATHER_STRENGTH = 0.7; // 0 = no pull, 1 = dots snap onto the cursor

type Particle = {
  x: number;
  y: number;
  z: number;
  size: number; // 0.5–2.4 relative dot size
  rampPhase: number; // where on the white↔blue ramp this dot starts
  rampSpeed: number; // how fast it drifts along the ramp
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
      rampPhase: Math.random() * Math.PI * 2,
      rampSpeed: 0.4 + Math.random() * 0.9,
    });
  }
  return particles;
}

// Pre-render one soft glow sprite per ramp step; drawImage is far
// cheaper than per-dot arc + gradient at this particle count.
function buildSprites(): HTMLCanvasElement[] {
  const SPRITE = 32;
  return Array.from({ length: RAMP_STEPS }, (_, i) => {
    const t = i / (RAMP_STEPS - 1);
    const rgb = `${Math.round(RAMP_FROM.r + (RAMP_TO.r - RAMP_FROM.r) * t)}, ${Math.round(
      RAMP_FROM.g + (RAMP_TO.g - RAMP_FROM.g) * t
    )}, ${Math.round(RAMP_FROM.b + (RAMP_TO.b - RAMP_FROM.b) * t)}`;
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
      Math.min(MAX_PARTICLES, Math.max(3600, Math.floor(area / 63)))
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

    // Cursor spotlight state — eased toward the real pointer each frame
    const pointer = { x: -9999, y: -9999, active: false };
    const eased = { x: -9999, y: -9999 };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (!pointer.active) {
        // First contact: snap the eased position so the glow doesn't fly in
        eased.x = pointer.x;
        eased.y = pointer.y;
        pointer.active = true;
      }
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

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

      // Ease the spotlight toward the pointer
      if (pointer.active) {
        eased.x += (pointer.x - eased.x) * POINTER_EASE;
        eased.y += (pointer.y - eased.y) * POINTER_EASE;
      }
      const spotlight = pointer.active && !reduceMotion;
      const pointerR2 = POINTER_RADIUS * POINTER_RADIUS;

      for (const particle of particles) {
        // Spin around Y, then tilt the whole axis around Z
        const rx = particle.x * cosR - particle.z * sinR;
        const z = particle.x * sinR + particle.z * cosR;
        const x = rx * cosTilt - particle.y * sinTilt;
        const y = rx * sinTilt + particle.y * cosTilt;

        const scale = perspective / (perspective + z);
        let px = cx + x * radius * scale;
        let py = cy + y * radius * scale;

        const depth = (1 - z) / 2; // 0 back → 1 front
        // Lambert-ish shading toward the light direction
        const lit = Math.max(0, x * LIGHT.x + y * LIGHT.y + z * LIGHT.z);

        // Cursor spotlight: dots inside the radius brighten AND gather
        // toward the pointer, with a smooth falloff. Front hemisphere
        // reacts most.
        let boost = 0;
        if (spotlight) {
          const dx = eased.x - px;
          const dy = eased.y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < pointerR2) {
            const falloff = 1 - Math.sqrt(d2) / POINTER_RADIUS;
            const react = 0.35 + depth * 0.65;
            boost = falloff * falloff * react;
            // Pull toward the cursor — strongest up close, so dots
            // visibly cluster around it while it moves
            const gather = falloff * falloff * GATHER_STRENGTH * react;
            px += dx * gather;
            py += dy * gather;
          }
        }

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        // Continuous white ↔ electric-blue drift, one sprite per ramp step
        const ramp =
          (Math.sin(time * particle.rampSpeed + particle.rampPhase) + 1) / 2;
        const sprite =
          sprites[Math.round(ramp * (RAMP_STEPS - 1) * (1 - boost))];

        const alpha =
          (0.42 + depth * 0.45 + lit * 0.6) * fade + boost * 0.8;
        if (alpha <= 0.02) continue;

        const size =
          (1.3 + lit * 1.4) * particle.size * scale * (1 + boost * 1.1);
        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.drawImage(sprite, px - size, py - size, size * 2, size * 2);
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
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave
      );
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
