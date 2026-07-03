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
import { LogoMark } from "./Logo";
import styles from "./HeroScene.module.css";

const BUBBLES = [
  { name: "Elite Living", top: "22%", left: "16%" },
  { name: "Piraeus Gate", top: "18%", left: "68%" },
  { name: "IMERAS", top: "42%", left: "8%" },
  { name: "Wyndham Mediterranean", top: "40%", left: "72%" },
  { name: "New Age Living", top: "70%", left: "12%" },
  { name: "Nuvia Urban Stay", top: "64%", left: "82%" },
  { name: "B-48", top: "80%", left: "44%" },
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
  const markOpacity = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);
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

        {/* Sima mark at the heart of the globe */}
        <motion.div
          className={styles.centerMark}
          style={reduceMotion ? undefined : { opacity: markOpacity }}
          aria-hidden="true"
        >
          <LogoMark size={72} />
        </motion.div>

        {/* Hero copy above the globe — fades out as the zoom begins */}
        <motion.div
          className={styles.overlay}
          style={
            reduceMotion ? undefined : { opacity: heroOpacity, y: heroY }
          }
        >
          <h1 className={styles.title}>Engineering Infrastructure</h1>
          <p className={styles.subtitle}>
            DK Techniki is the architecture and construction branch of DKG
            Development — designing, engineering and delivering exceptional
            buildings, from first sketch to final build.
          </p>

          <div className={styles.stats}>
            <div className={styles.statsGroup}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Total SQM Built</div>
                <div className={styles.statValue}>
                  <Counter target={122000} duration={2} />
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.statLabel}>Apartments Designed</div>
                <div className={styles.statValue}>
                  <Counter target={1000} suffix="+" duration={2} />
                </div>
              </div>
            </div>

            <div className={styles.scrollCue} aria-hidden="true">
              Scroll to explore ↓
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
            Driven by experts creating the next generation of architectural
            spaces.
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
