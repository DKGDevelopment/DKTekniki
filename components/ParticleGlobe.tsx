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

const VERTEX_SHADER = `
precision mediump float;

attribute vec3 a_pos;      // unit-sphere position (jittered shell)
attribute float a_size;    // 0.5 - 2.4 relative dot size
attribute vec2 a_ramp;     // x: phase, y: speed of white<->blue drift

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

function compileProgram(gl: WebGLRenderingContext): WebGLProgram | null {
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

  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
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
  }
  return { positions, sizes, ramps };
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

    const program = compileProgram(gl);
    if (!program) return;
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
    const { positions, sizes, ramps } = buildParticleBuffers(count);

    const bindAttribute = (
      name: string,
      data: Float32Array,
      itemSize: number
    ) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, itemSize, gl.FLOAT, false, 0, 0);
    };

    bindAttribute("a_pos", positions, 3);
    bindAttribute("a_size", sizes, 1);
    bindAttribute("a_ramp", ramps, 2);

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
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.center, width / 2, height * CENTER_Y_FACTOR);
      gl.uniform1f(uniforms.dpr, dpr);
    };

    const draw = () => {
      const p = reduceMotion ? 0 : progress.get();
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Zoom: sphere radius grows from its resting size to well past it.
      const baseRadius = Math.min(width, height) * RADIUS_FACTOR;
      const fade = 1 - Math.max(0, (p - 0.55) / 0.45); // dissolve near the end
      if (fade <= 0.01) return;

      if (pointer.active) {
        eased.x += (pointer.x - eased.x) * POINTER_EASE;
        eased.y += (pointer.y - eased.y) * POINTER_EASE;
      }
      const spotlight = pointer.active && !reduceMotion;

      gl.uniform1f(uniforms.rotation, rotation);
      gl.uniform1f(uniforms.radius, baseRadius * (1 + p * 3.2));
      gl.uniform1f(uniforms.fade, fade);
      gl.uniform1f(uniforms.time, time);
      gl.uniform3f(uniforms.pointer, eased.x, eased.y, spotlight ? 1 : 0);

      gl.drawArrays(gl.POINTS, 0, count);

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
