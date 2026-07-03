"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import ParticleGlobe from "./ParticleGlobe";
import Counter from "./Counter";
import styles from "./HeroScene.module.css";

const BUBBLES = [
  { name: "Nordkraft", top: "22%", left: "16%" },
  { name: "Attiki Systems", top: "18%", left: "68%" },
  { name: "Vertex Labs", top: "42%", left: "8%" },
  { name: "Heliotrope", top: "40%", left: "78%" },
  { name: "Piraeus Cloud", top: "70%", left: "12%" },
  { name: "Kymata", top: "64%", left: "82%" },
  { name: "Delta Forge", top: "80%", left: "44%" },
];

export default function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -40]);
  const constellationOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.75],
    [0, 1]
  );

  return (
    <div ref={sceneRef} className={styles.scene}>
      <div className={styles.stage}>
        <div className={styles.canvas}>
          <ParticleGlobe progress={scrollYProgress} />
        </div>

        {/* Hero copy — fades out as the globe zoom begins */}
        <motion.div
          className={styles.overlay}
          style={
            reduceMotion ? undefined : { opacity: heroOpacity, y: heroY }
          }
        >
          <h1 className={styles.title}>Engineering Infrastructure</h1>
          <p className={styles.subtitle}>
            DK Techniki is the architecture and construction branch of our
            company — designing, engineering and delivering exceptional
            buildings, from first sketch to final build.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>
                <Counter target={122000} duration={2} />
              </div>
              <div className={styles.statLabel}>Total SQM Built</div>
            </div>

            <div className={styles.scrollCue} aria-hidden="true">
              Scroll to explore ↓
            </div>

            <div className={styles.stat}>
              <div className={styles.statValue}>
                <Counter target={1000} suffix="+" duration={2} />
              </div>
              <div className={styles.statLabel}>Apartments Designed</div>
            </div>
          </div>
        </motion.div>

        {/* Logo constellation — particles resolve into brand bubbles */}
        <motion.div
          className={styles.constellation}
          style={reduceMotion ? undefined : { opacity: constellationOpacity }}
          aria-hidden={!reduceMotion}
        >
          <h2 className={styles.constellationTitle}>
            Powered by teams building the next generation of infrastructure
          </h2>

          {BUBBLES.map((bubble, i) => (
            <motion.div
              key={bubble.name}
              className={styles.bubble}
              style={{ top: bubble.top, left: bubble.left }}
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, i % 2 === 0 ? -10 : 10, 0] }
              }
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className={styles.bubbleDot} aria-hidden="true" />
              {bubble.name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
