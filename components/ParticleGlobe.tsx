"use client";

// TODO: WebGL globe — this is the canvas-2D fallback pass. Swap for an
// OGL/raw-WebGL particle sphere when upgrading the hero visual.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const PARTICLE_COUNT = 900;
const ACCENT = { r: 126, g: 155, b: 255 }; // --accent-light

type Particle = { x: number; y: number; z: number };

function fibonacciSphere(count: number): Particle[] {
  const points: Particle[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }
  return points;
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

    const particles = fibonacciSphere(PARTICLE_COUNT);
    let rotation = 0;
    let rafId = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      // Zoom: sphere radius grows from ~38% of viewport to well past it.
      const baseRadius = Math.min(width, height) * 0.38;
      const radius = baseRadius * (1 + p * 3.2);
      const fade = 1 - Math.max(0, (p - 0.55) / 0.45); // dissolve near the end
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const perspective = 3;

      for (const particle of particles) {
        const x = particle.x * cosR - particle.z * sinR;
        const z = particle.x * sinR + particle.z * cosR;
        const scale = perspective / (perspective + z);
        const px = cx + x * radius * scale;
        const py = cy + particle.y * radius * scale;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        const depth = (1 - z) / 2; // 0 back → 1 front
        const alpha = (0.12 + depth * 0.55) * fade;
        if (alpha <= 0.01) continue;

        const size = (0.8 + depth * 1.6) * scale;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${alpha})`;
        ctx.fill();
      }

      if (!reduceMotion) rotation += 0.0016;
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
