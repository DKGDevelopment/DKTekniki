import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  size?: "default" | "small";
  arrow?: "↗" | "→" | null;
  className?: string;
};

export default function Button({
  children,
  href,
  variant = "ghost",
  size = "default",
  arrow = null,
  className,
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size === "small" ? styles.small : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {children}
      {arrow && (
        <span className={styles.arrow} aria-hidden="true">
          {arrow}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <button className={classes}>{content}</button>;
}
