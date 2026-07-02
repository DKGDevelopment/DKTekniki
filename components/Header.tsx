"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Button from "./Button";
import styles from "./Header.module.css";

type MenuItem = { title: string; sub: string; href: string };

const MENUS: Record<string, MenuItem[]> = {
  Products: [
    { title: "Build", sub: "Design and assemble systems fast", href: "#features" },
    { title: "Deploy", sub: "Ship to any environment", href: "#features" },
    { title: "Monitor", sub: "Live observability out of the box", href: "#features" },
  ],
  Solutions: [
    { title: "For startups", sub: "Move fast without breaking prod", href: "#features" },
    { title: "For enterprises", sub: "Scale with guarantees", href: "#trust" },
    { title: "For agencies", sub: "Deliver for every client", href: "#features" },
  ],
  Resources: [
    { title: "Documentation", sub: "Guides and API reference", href: "#open" },
    { title: "Blog", sub: "Engineering deep dives", href: "#open" },
    { title: "Community", sub: "Join the conversation", href: "#open" },
  ],
};

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
      aria-hidden="true"
    >
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path
          d="M1 1L5 5L9 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
      setOpenMenu(null);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      className={styles.header}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="DKTekniki home">
          <span className={styles.logoMark} aria-hidden="true" />
          DKTekniki
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {Object.entries(MENUS).map(([label, items]) => (
            <div
              key={label}
              className={styles.navItem}
              onMouseEnter={() => setOpenMenu(label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                className={styles.navLink}
                aria-expanded={openMenu === label}
                onClick={() =>
                  setOpenMenu(openMenu === label ? null : label)
                }
              >
                {label}
                <Chevron open={openMenu === label} />
              </button>

              <AnimatePresence>
                {openMenu === label && (
                  <motion.div
                    className={styles.panel}
                    initial={{ scaleY: 0, x: "-50%" }}
                    animate={{ scaleY: 1, x: "-50%" }}
                    exit={{ scaleY: 0, x: "-50%", opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    {items.map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: "easeOut",
                          delay: 0.04 * i,
                        }}
                      >
                        <Link href={item.href} className={styles.panelItem}>
                          <span className={styles.panelItemTitle}>
                            {item.title}
                          </span>
                          <br />
                          <span className={styles.panelItemSub}>{item.sub}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <Link href="#open" className={styles.navLink}>
            Docs
          </Link>
        </nav>

        <Button href="#cta" variant="primary" arrow="↗" className={styles.cta}>
          Launch App
        </Button>
      </div>
    </motion.header>
  );
}
