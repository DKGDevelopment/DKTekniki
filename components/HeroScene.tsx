"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import ParticleGlobe from "./ParticleGlobe";
import ProjectSphere from "./ProjectSphere";
import Counter from "./Counter";
import { LogoMark } from "./Logo";
import styles from "./HeroScene.module.css";

export default function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -40]);
  // The solid mark hands off to the WebGL departiculation at 0.4
  const markOpacity = useTransform(scrollYProgress, [0.36, 0.44], [1, 0]);
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
            Designing, engineering and delivering exceptional buildings, from
            first sketch to final build.
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

        {/* Projects constellation — a rotating sphere of project badges
            orbiting the heading */}
        <motion.div
          className={styles.constellation}
          style={reduceMotion ? undefined : { opacity: constellationOpacity }}
          aria-hidden={!reduceMotion}
        >
          <ProjectSphere />
          <h2 className={styles.constellationTitle}>
            Driven by experts creating the next generation of architectural
            spaces.
          </h2>
        </motion.div>
      </div>
    </div>
  );
}
