import type { Metadata } from "next";
import {
  Archivo_Black,
  Caveat,
  DM_Serif_Display,
  Geist,
  Geist_Mono,
  Gochi_Hand,
  Special_Elite,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

const gochiHand = Gochi_Hand({
  variable: "--font-gochi",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Napkins",
  description: "An art zine for Minervans by Minervans",
  other: {
    // opt out of Dark Reader — the site is art-directed around a fixed palette
    // needs a non-empty value: Next.js drops `other` entries whose value is ""
    "darkreader-lock": "true",
  },
};

/**
 * Decides whether the intro title card plays, before the browser paints.
 *
 * It has to run here, synchronously in <head>, rather than in an effect: an
 * effect runs after the first paint, so a returning visitor would see a frame
 * of the card before it was hidden — the exact flash the card exists to avoid.
 * CSS keyed to `data-intro` in landing.module.css does the hiding.
 *
 * Three reasons not to play it:
 *   - the visitor asked for reduced motion
 *   - they have seen it within the last day
 *   - they did not arrive at "/" — someone who hard-loads /Events and then
 *     clicks the logo is already inside the site, and a full-screen title card
 *     mid-session is an interruption rather than a welcome
 *
 * Kept in one string so it stays in sync with IntroAnimation.tsx; the constants
 * are duplicated there deliberately, since this file cannot import from a
 * client component's module without pulling it into the server bundle.
 */
const INTRO_GATE = `(function(){try{var d=document.documentElement;
if(location.pathname!=="/"){d.setAttribute("data-intro","seen");return}
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-intro","seen");return}
var t=localStorage.getItem("napkins:intro-seen");
if(t&&Date.now()-Number(t)<86400000){d.setAttribute("data-intro","seen")}
}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-intro="new"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${archivoBlack.variable} ${dmSerifDisplay.variable} ${specialElite.variable} ${gochiHand.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        {/* The card is server-rendered so there is no flash of the page before
            it. Without scripting nothing could ever dismiss it, so with
            scripting off it is never shown and the scroll lock never applies. */}
        <noscript>
          <style>{`.intro-card{display:none}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
