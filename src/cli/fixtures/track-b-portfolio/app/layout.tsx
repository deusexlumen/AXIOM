import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import "@/generated/theme.css";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata = {
  title: "Studio Obscura — Bespoke Portfolio",
  description: "Bespoke portfolio experience for Studio Obscura.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} antialiased`}>{children}</body>
    </html>
  );
}
