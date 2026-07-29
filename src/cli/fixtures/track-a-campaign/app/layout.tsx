import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import "@/generated/theme.css";
import "./globals.css";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata = {
  title: "Axiom Track A — Neon Curated",
  description: "Curated campaign landing page for AXIOM/ATELIER v3.0.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${space.variable} antialiased`}>{children}</body>
    </html>
  );
}
