import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { themeInitScript } from "@/components/theme-toggle";
import { AuthProvider } from "@/lib/firebase/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Desi Auto-Caption — AI captions for Hindi & Hinglish reels",
    template: "%s · Desi Auto-Caption",
  },
  description:
    "Word-level animated captions for Instagram Reels and YouTube Shorts, tuned for Hindi and Hinglish. Your video never leaves your browser.",
  applicationName: "Desi Auto-Caption",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Shipped default theme is light mode; the toggle adds the `dark` class if dark theme is chosen.
    // `fontVariables` lives here, not on `<body>`: `globals.css`'s
    // `--bolo-font-*` stacks are declared on `:root` and each references a
    // `--font-*` variable (e.g. `--bolo-font-montserrat: var(--font-montserrat)...`).
    // A custom property's var() references resolve using whatever is in scope
    // at the element where that property's own declaration wins the cascade —
    // not re-resolved per descendant — so if `--font-montserrat` only existed
    // one level down on `<body>`, `--bolo-font-montserrat` was unresolvable at
    // `:root` and inherited everywhere as invalid. Every caption font in the
    // app was silently falling back to the UI's default sans as a result.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/*
          Applies the stored theme before first paint. Render-blocking on
          purpose — deferring it produces a dark-to-light flash for every
          light-theme user on every navigation.

          Lives as the first child of <body>, not in a hand-written <head>:
          App Router owns <head>, and injecting one there makes React's
          hydration see markup it did not render (error #418).
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
