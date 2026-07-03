import Header from "@/components/Header";
import HeroScene from "@/components/HeroScene";
import FeatureCard, { type Feature } from "@/components/FeatureCard";
import ToolsCard from "@/components/ToolsCard";
import TrustRow from "@/components/TrustRow";
import InvestorGrid from "@/components/InvestorGrid";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import FadeUp from "@/components/FadeUp";
import styles from "./page.module.css";

const FEATURES: Feature[] = [
  {
    title: "Residential architecture designed around living",
    body: "From single apartments to full residential developments — homes shaped by light, flow and the way people actually live in them.",
    customers: ["Elite Living", "New Age Living", "Nuvia Urban Stay", "B-48"],
    visual: "grid",
  },
  {
    title: "Commercial and mixed-use spaces that perform",
    body: "Offices, retail and hospitality designed to work hard for their owners — efficient layouts, strong identity and lasting value.",
    customers: ["Piraeus Gate", "IMERAS", "Wyndham Mediterranean"],
    visual: "orbit",
  },
  {
    title: "Construction delivered from permit to handover",
    body: "We supervise what we design. Permitting, engineering and on-site management under one roof, so nothing is lost in translation.",
    customers: ["B-48", "Elite Living", "IMERAS", "Piraeus Gate"],
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
            <p className="eyebrow">What we do</p>
            <h2 className={styles.sectionHeading}>
              Spaces designed around the people who use them
            </h2>
          </FadeUp>
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} reversed={i % 2 === 1} />
          ))}
        </section>

        {/* 4. Architecture & tools */}
        <section id="open" className="section container">
          <FadeUp>
            <p className="eyebrow">How we design</p>
            <h2 className={styles.sectionHeading}>
              Architecture crafted with precision, from concept to construction
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <ToolsCard />
          </FadeUp>
        </section>

        {/* 5. Trust row */}
        <section id="trust" className="section container">
          <FadeUp>
            <p className="eyebrow">Why DK Techniki</p>
            <h2 className={styles.sectionHeading}>
              Trusted where it matters most
            </h2>
          </FadeUp>
          <TrustRow />
        </section>

        {/* 6. Investor grid */}
        <section id="investors" className="section container">
          <FadeUp>
            <p className="eyebrow">Our network</p>
            <h2 className={styles.sectionHeading}>
              Delivered with trusted partners across the industry
            </h2>
          </FadeUp>
          <InvestorGrid />
        </section>

        {/* 7. Final CTA */}
        <section id="cta" className="section container">
          <FadeUp className={styles.cta}>
            <h2 className={styles.ctaHeading}>
              Let&apos;s design your next project together
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
