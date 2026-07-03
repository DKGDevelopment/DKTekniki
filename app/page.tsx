import Header from "@/components/Header";
import HeroScene from "@/components/HeroScene";
import FeatureCard, { type Feature } from "@/components/FeatureCard";
import CodeCard from "@/components/CodeCard";
import TrustRow from "@/components/TrustRow";
import InvestorGrid from "@/components/InvestorGrid";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import FadeUp from "@/components/FadeUp";
import styles from "./page.module.css";

const FEATURES: Feature[] = [
  {
    title: "Build on primitives that scale with you",
    body: "Compose services from audited, production-hardened building blocks. Start small and grow to global scale without re-architecting.",
    customers: ["Nordkraft", "Vertex Labs", "Kymata", "Heliotrope"],
    visual: "grid",
  },
  {
    title: "Deploy anywhere, verify everything",
    body: "Every deployment is reproducible and signed. Roll out to any region with one command and audit the full supply chain.",
    customers: ["Attiki Systems", "Delta Forge", "Piraeus Cloud"],
    visual: "orbit",
  },
  {
    title: "Observe your whole stack in real time",
    body: "Metrics, traces and logs unified in a single pane. Alerting that understands your topology, not just your thresholds.",
    customers: ["Kymata", "Nordkraft", "Delta Forge", "Vertex Labs"],
    visual: "stack",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* 1–2. Hero + logo constellation (shared scroll-scrubbed canvas) */}
        <HeroScene />

        {/* 3. Feature blocks */}
        <section id="features" className="section container">
          <FadeUp>
            <p className="eyebrow">What you can build</p>
            <h2 className={styles.sectionHeading}>
              Infrastructure that works the way your team does
            </h2>
          </FadeUp>
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} reversed={i % 2 === 1} />
          ))}
        </section>

        {/* 4. Open / secure */}
        <section id="open" className="section container">
          <FadeUp>
            <p className="eyebrow">Open &amp; secure</p>
            <h2 className={styles.sectionHeading}>
              Fully open source, verifiable from the first line
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <CodeCard />
          </FadeUp>
        </section>

        {/* 5. Trust row */}
        <section id="trust" className="section container">
          <FadeUp>
            <p className="eyebrow">Security</p>
            <h2 className={styles.sectionHeading}>
              Trusted where it matters most
            </h2>
          </FadeUp>
          <TrustRow />
        </section>

        {/* 6. Investor grid */}
        <section id="investors" className="section container">
          <FadeUp>
            <p className="eyebrow">Backed by</p>
            <h2 className={styles.sectionHeading}>
              Supported by world-class investors
            </h2>
          </FadeUp>
          <InvestorGrid />
        </section>

        {/* 7. Final CTA */}
        <section id="cta" className="section container">
          <FadeUp className={styles.cta}>
            <h2 className={styles.ctaHeading}>
              Start building on DK Techniki today
            </h2>
            <Button href="#" variant="primary" arrow="→">
              Contact us
            </Button>
          </FadeUp>
        </section>
      </main>

      {/* 8. Footer */}
      <Footer />
    </>
  );
}
