import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { themeInitScript } from "@/components/theme-toggle";
import { AuthProvider } from "@/lib/firebase/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bolo — AI captions for Hindi & Hinglish reels",
    template: "%s · Bolo",
  },
  description:
    "Word-level animated captions for Instagram Reels and YouTube Shorts, tuned for Hindi and Hinglish. Your video never leaves your browser.",
  applicationName: "Bolo",
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
    <html lang="en" className="" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans antialiased`}>
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
