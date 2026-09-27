import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Scanlines } from "@/components/Scanlines";

const jetbrains = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-pdisplay",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Instinct Series — egomonk",
  description:
    "A spatial narrative quiz that maps your decisions to a business archetype and mints your instinct.",
  openGraph: {
    title: "The Instinct Series — egomonk",
    description:
      "Map your organizational instinct. Mint the coin.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jetbrains.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        {children}
        <Scanlines />
      </body>
    </html>
  );
}