import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DK Techniki — Building Innovation",
  description:
    "DK Techniki is the architecture and construction branch of our company — designing, engineering and delivering exceptional buildings, from first sketch to final build.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
