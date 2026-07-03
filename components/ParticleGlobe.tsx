"use client";

// WebGL particle globe. All per-particle work (rotation, projection,
// lighting, color drift, cursor spotlight/gather) runs in the vertex
// shader, so frame cost on the CPU is a handful of uniform uploads.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const MAX_PARTICLES = 21000;
const ROTATION_SPEED = 0.0038;
const AXIS_TILT = -0.28; // radians, tips the globe like a planet
const RADIUS_FACTOR = 0.26; // sphere radius as fraction of viewport
const CENTER_Y_FACTOR = 0.61; // sphere center sits below the hero copy

// Cursor spotlight: dots within this screen radius brighten, grow and
// gather toward the pointer
const POINTER_RADIUS = 210;
const POINTER_EASE = 0.12;
const GATHER_STRENGTH = 0.7; // 0 = no pull, 1 = dots snap onto the cursor

// Intro: dots fly in from beyond the screen edges and accumulate into
// the sphere over this many milliseconds (staggered per particle)
const INTRO_DURATION = 2600;

// Residual starfield once the globe has dissolved into the next section
const STARFIELD_FLOOR = 0.14;

// Logo departiculation: scroll progress window over which the center
// mark crumbles into particles and scatters
const LOGO_DISSOLVE_START = 0.4;
const LOGO_DISSOLVE_END = 0.66;
const LOGO_MARK_SIZE = 72; // must match the <LogoMark size> in HeroScene

// sima.svg geometry (viewBox 27.2 26.9 49.9 54.5): the seven polygons,
// used to sample the particle cloud that replaces the mark on dissolve
const LOGO_POLYGONS: { points: [number, number][]; grey: boolean }[] = [
  { points: [[41.2, 51.1], [52, 57.8], [52, 52.1], [41.1, 45.5]], grey: false },
  { points: [[75.1, 45], [52, 57.8], [52, 52.1], [75.1, 39.3]], grey: true },
  { points: [[41.2, 61.9], [52, 68.6], [52, 62.9], [41.1, 56.3]], grey: false },
  { points: [[75.1, 55.7], [52, 68.6], [52, 62.9], [75.1, 50.1]], grey: true },
  { points: [[41.2, 72.7], [52, 79.4], [52, 73.7], [41.1, 67.1]], grey: false },
  { points: [[75.1, 66.5], [52, 79.4], [52, 73.7], [75.1, 60.9]], grey: true },
  {
    points: [
      [33.7, 69.5], [33.7, 44.2], [52, 34.3], [65.3, 41.6],
      [70, 38.7], [52, 28.9], [29.2, 41.2], [29.2, 66.6],
    ],
    grey: false,
  },
];

const VERTEX_SHADER = `
precision mediump float;

attribute vec3 a_pos;      // unit-sphere position (jittered shell)
attribute float a_size;    // 0.5 - 2.4 relative dot size
attribute vec2 a_ramp;     // x: phase, y: speed of white<->blue drift
attribute vec3 a_scatter;  // xy: fly-in direction * distance, z: delay

uniform vec2 u_resolution; // canvas size in css px
uniform vec2 u_center;     // sphere center in css px
uniform float u_dpr;
uniform float u_rotation;
uniform float u_cosTilt;
uniform float u_sinTilt;
uniform float u_radius;    // sphere radius in css px
uniform float u_fade;
uniform float u_time;
uniform vec3 u_pointer;    // x, y in css px; z = active flag
uniform float u_pointerRadius;
uniform float u_gather;
uniform float u_intro;     // 0 = scattered off-screen, 1 = formed sphere
uniform float u_scatterRadius;

varying float v_alpha;
varying vec3 v_color;

const vec3 LIGHT = vec3(0.5, -0.65, 0.57);
const vec3 WHITE = vec3(1.0, 1.0, 1.0);
const vec3 BLUE = vec3(0.239, 0.478, 1.0); // electric blue #3D7AFF
const float PERSPECTIVE = 3.0;

void main() {
  // Spin around Y, then tilt the whole axis around Z
  float cosR = cos(u_rotation);
  float sinR = sin(u_rotation);
  float rx = a_pos.x * cosR - a_pos.z * sinR;
  float z = a_pos.x * sinR + a_pos.z * cosR;
  float x = rx * u_cosTilt - a_pos.y * u_sinTilt;
  float y = rx * u_sinTilt + a_pos.y * u_cosTilt;

  float scale = PERSPECTIVE / (PERSPECTIVE + z);
  vec2 px = u_center + vec2(x, y) * u_radius * scale;

  // Intro accumulation: blend from a far-off scatter point toward the
  // sphere position, staggered and smoothstepped per particle
  float intro = clamp((u_intro - a_scatter.z) / (1.0 - a_scatter.z), 0.0, 1.0);
  intro = intro * intro * (3.0 - 2.0 * intro);
  vec2 scatterPx = u_center + a_scatter.xy * u_scatterRadius;
  px = mix(scatterPx, px, intro);

  float depth = (1.0 - z) * 0.5; // 0 back -> 1 front
  float lit = max(0.0, dot(vec3(x, y, z), LIGHT));

  // Cursor spotlight: brighten + gather, squared falloff, front-weighted
  float boost = 0.0;
  if (u_pointer.z > 0.5) {
    vec2 toPointer = u_pointer.xy - px;
    float d = length(toPointer);
    if (d < u_pointerRadius) {
      float falloff = 1.0 - d / u_pointerRadius;
      float react = 0.35 + depth * 0.65;
      boost = falloff * falloff * react;
      px += toPointer * (falloff * falloff * u_gather * react);
    }
  }

  // Continuous white <-> electric-blue drift; spotlight pulls toward white
  float ramp = (sin(u_time * a_ramp.y + a_ramp.x) + 1.0) * 0.5;
  v_color = mix(WHITE, BLUE, ramp * (1.0 - boost));

  v_alpha = clamp((0.42 + depth * 0.45 + lit * 0.6) * u_fade + boost * 0.8, 0.0, 1.0);
  v_alpha *= 0.35 + 0.65 * intro; // incoming dots glow up as they settle

  float size = (1.3 + lit * 1.4) * a_size * scale * (1.0 + boost * 1.1);
  gl_PointSize = size * 2.0 * u_dpr;

  vec2 clip = (px / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying float v_alpha;
varying vec3 v_color;

void main() {
  // Soft glow matching the old radial-gradient sprites
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float glow = 1.0 - smoothstep(0.0, 1.0, d);
  glow *= mix(1.0, 0.85, smoothstep(0.0, 0.35, d));
  gl_FragColor = vec4(v_color, v_alpha * glow);
}
`;

// Second, tiny program: the logo mark as a point cloud that scatters
const LOGO_VERTEX_SHADER = `
precision mediump float;

attribute vec2 a_off;    // offset from mark center in css px
attribute vec3 a_burst;  // xy: scatter direction, z: stagger delay
attribute float a_grey;  // 0 = white face, 1 = grey face

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_dpr;
uniform float u_dissolve; // 0 = intact mark, 1 = fully scattered

varying float v_alpha;
varying float v_grey;

void main() {
  float d = clamp((u_dissolve - a_burst.z * 0.35) / (1.0 - a_burst.z * 0.35), 0.0, 1.0);
  float e = d * d;
  vec2 px = u_center + a_off + a_burst.xy * e * 420.0;

  v_grey = a_grey;
  v_alpha = smoothstep(0.0, 0.05, u_dissolve) * (1.0 - smoothstep(0.35, 0.95, d));

  gl_PointSize = (2.6 - 1.1 * d) * u_dpr;
  vec2 clip = (px / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const LOGO_FRAGMENT_SHADER = `
precision mediump float;

varying float v_alpha;
varying float v_grey;

void main() {
  if (length(gl_PointCoord - 0.5) > 0.5) discard;
  vec3 color = mix(vec3(1.0), vec3(0.7), v_grey);
  gl_FragColor = vec4(color, v_alpha);
}
`;

function pointInPolygon(x: number, y: number, points: [number, number][]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Sample points inside the sima polygons, in css-px offsets from the
// mark center at its rendered size
function buildLogoParticles() {
  const scale = LOGO_MARK_SIZE / 54.5; // viewBox max dimension → px
  const cx = 27.2 + 49.9 / 2;
  const cy = 26.9 + 54.5 / 2;
  const offsets: number[] = [];
  const bursts: number[] = [];
  const greys: number[] = [];
  const step = 0.62;

  for (let y = 26.9; y <= 81.4; y += step) {
    for (let x = 27.2; x <= 77.1; x += step) {
      const jx = x + (Math.random() - 0.5) * step;
      const jy = y + (Math.random() - 0.5) * step;
      for (const poly of LOGO_POLYGONS) {
        if (pointInPolygon(jx, jy, poly.points)) {
          offsets.push((jx - cx) * scale, (jy - cy) * scale);
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 0.9;
          bursts.push(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 0.25, // slight upward bias
            Math.random() * 0.6
          );
          greys.push(poly.grey ? 1 : 0);
          break;
        }
      }
    }
  }
  return {
    offsets: new Float32Array(offsets),
    bursts: new Float32Array(bursts),
    greys: new Float32Array(greys),
    count: greys.length,
  };
}

function compileProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}

function buildParticleBuffers(count: number) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const ramps = new Float32Array(count * 2);
  const scatters = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    // Jitter the shell slightly so the surface reads organic, not gridded
    const shell = 0.94 + Math.random() * 0.08;
    positions[i * 3] = Math.cos(theta) * radius * shell;
    positions[i * 3 + 1] = y * shell;
    positions[i * 3 + 2] = Math.sin(theta) * radius * shell;
    sizes[i] = 0.5 + Math.random() * Math.random() * 1.9;
    ramps[i * 2] = Math.random() * Math.PI * 2;
    ramps[i * 2 + 1] = 0.4 + Math.random() * 0.9;
    // Fly-in start: random direction from every side of the screen,
    // random distance past the edges, random stagger delay
    const angle = Math.random() * Math.PI * 2;
    const distance = 0.9 + Math.random() * 0.7;
    scatters[i * 3] = Math.cos(angle) * distance;
    scatters[i * 3 + 1] = Math.sin(angle) * distance;
    scatters[i * 3 + 2] = Math.random() * 0.45;
  }
  return { positions, sizes, ramps, scatters };
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
    const gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      }) ||
      (canvas.getContext(
        "experimental-webgl"
      ) as WebGLRenderingContext | null);
    if (!gl) return; // no WebGL: globe is decorative, page still works

    const program = compileProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const logoProgram = compileProgram(
      gl,
      LOGO_VERTEX_SHADER,
      LOGO_FRAGMENT_SHADER
    );
    if (!program || !logoProgram) return;
    gl.useProgram(program);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Density scales with viewport so phones draw a fraction of the dots
    const area = canvas.clientWidth * canvas.clientHeight;
    const count = Math.min(
      MAX_PARTICLES,
      Math.max(3600, Math.floor(area / 63))
    );
    const { positions, sizes, ramps, scatters } = buildParticleBuffers(count);

    // Attribute buffers live per-program; remember locations + buffers so
    // we can rebind when switching programs each frame
    const makeAttributes = (
      target: WebGLProgram,
      specs: { name: string; data: Float32Array; itemSize: number }[]
    ) => {
      return specs.map(({ name, data, itemSize }) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const location = gl.getAttribLocation(target, name);
        return { buffer, location, itemSize };
      });
    };

    const bindAttributes = (
      attrs: ReturnType<typeof makeAttributes>,
      enabledCount: { current: number }
    ) => {
      // Disable any leftover attribute slots from the other program
      for (let i = 0; i < enabledCount.current; i++) gl.disableVertexAttribArray(i);
      let maxLoc = 0;
      for (const { buffer, location, itemSize } of attrs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, itemSize, gl.FLOAT, false, 0, 0);
        maxLoc = Math.max(maxLoc, location + 1);
      }
      enabledCount.current = maxLoc;
    };

    const enabledAttrs = { current: 0 };

    const globeAttrs = makeAttributes(program, [
      { name: "a_pos", data: positions, itemSize: 3 },
      { name: "a_size", data: sizes, itemSize: 1 },
      { name: "a_ramp", data: ramps, itemSize: 2 },
      { name: "a_scatter", data: scatters, itemSize: 3 },
    ]);

    const logo = buildLogoParticles();
    const logoAttrs = makeAttributes(logoProgram, [
      { name: "a_off", data: logo.offsets, itemSize: 2 },
      { name: "a_burst", data: logo.bursts, itemSize: 3 },
      { name: "a_grey", data: logo.greys, itemSize: 1 },
    ]);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      center: gl.getUniformLocation(program, "u_center"),
      dpr: gl.getUniformLocation(program, "u_dpr"),
      rotation: gl.getUniformLocation(program, "u_rotation"),
      cosTilt: gl.getUniformLocation(program, "u_cosTilt"),
      sinTilt: gl.getUniformLocation(program, "u_sinTilt"),
      radius: gl.getUniformLocation(program, "u_radius"),
      fade: gl.getUniformLocation(program, "u_fade"),
      time: gl.getUniformLocation(program, "u_time"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      pointerRadius: gl.getUniformLocation(program, "u_pointerRadius"),
      gather: gl.getUniformLocation(program, "u_gather"),
      intro: gl.getUniformLocation(program, "u_intro"),
      scatterRadius: gl.getUniformLocation(program, "u_scatterRadius"),
    };

    const logoUniforms = {
      resolution: gl.getUniformLocation(logoProgram, "u_resolution"),
      center: gl.getUniformLocation(logoProgram, "u_center"),
      dpr: gl.getUniformLocation(logoProgram, "u_dpr"),
      dissolve: gl.getUniformLocation(logoProgram, "u_dissolve"),
    };

    gl.uniform1f(uniforms.cosTilt, Math.cos(AXIS_TILT));
    gl.uniform1f(uniforms.sinTilt, Math.sin(AXIS_TILT));
    gl.uniform1f(uniforms.pointerRadius, POINTER_RADIUS);
    gl.uniform1f(uniforms.gather, GATHER_STRENGTH);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let rotation = 0;
    let time = 0;
    let rafId = 0;
    let width = 0;
    let height = 0;
    const introStart = performance.now();

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.center, width / 2, height * CENTER_Y_FACTOR);
      gl.uniform1f(uniforms.dpr, dpr);
      gl.uniform1f(uniforms.scatterRadius, Math.max(width, height));
      gl.useProgram(logoProgram);
      gl.uniform2f(logoUniforms.resolution, width, height);
      gl.uniform2f(logoUniforms.center, width / 2, height * CENTER_Y_FACTOR);
      gl.uniform1f(logoUniforms.dpr, dpr);
    };

    const draw = () => {
      const p = reduceMotion ? 0 : progress.get();
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Zoom: sphere radius grows from its resting size to well past it.
      // Once dissolved, a faint residue of dots stays as a starfield
      // behind the projects sphere.
      const baseRadius = Math.min(width, height) * RADIUS_FACTOR;
      const fade = Math.max(
        1 - Math.max(0, (p - 0.55) / 0.45),
        STARFIELD_FLOOR
      );

      if (pointer.active) {
        eased.x += (pointer.x - eased.x) * POINTER_EASE;
        eased.y += (pointer.y - eased.y) * POINTER_EASE;
      }
      const spotlight = pointer.active && !reduceMotion;

      // Intro accumulation progress, eased out; skipped for reduced motion
      const introT = reduceMotion
        ? 1
        : Math.min((performance.now() - introStart) / INTRO_DURATION, 1);
      const intro = 1 - Math.pow(1 - introT, 3);

      gl.useProgram(program);
      bindAttributes(globeAttrs, enabledAttrs);
      gl.uniform1f(uniforms.rotation, rotation);
      gl.uniform1f(uniforms.radius, baseRadius * (1 + p * 3.2));
      gl.uniform1f(uniforms.fade, fade);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.intro, intro);
      gl.uniform3f(uniforms.pointer, eased.x, eased.y, spotlight ? 1 : 0);

      gl.drawArrays(gl.POINTS, 0, count);

      // Logo departiculation pass, only while it's in progress
      const dissolve =
        (p - LOGO_DISSOLVE_START) / (LOGO_DISSOLVE_END - LOGO_DISSOLVE_START);
      if (!reduceMotion && dissolve > 0 && dissolve < 1) {
        gl.useProgram(logoProgram);
        bindAttributes(logoAttrs, enabledAttrs);
        gl.uniform1f(logoUniforms.dissolve, dissolve);
        gl.drawArrays(gl.POINTS, 0, logo.count);
      }

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
      cancelAnimationFrame(rafId);
      if (entry.isIntersecting && !reduceMotion) {
        rafId = requestAnimationFrame(loop);
      } else if (entry.isIntersecting) {
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
      gl.getExtension("WEBGL_lose_context")?.loseContext();
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
