"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const THEME_STORAGE_KEY = "bolo-theme";

/**
 * Runs before React hydrates to apply the stored theme, so a user on the light
 * theme never sees a dark flash on first paint. Kept as a raw string because it
 * has to execute synchronously in <head>, ahead of any bundle.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = stored === 'dark';
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Read the class the init script already applied rather than re-deriving it,
  // so the button label matches what is actually on screen.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      } catch {
        // Private mode or blocked storage — the toggle still works for this
        // session, it just will not be remembered.
      }
      return next;
    });
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative size-9 text-muted-foreground hover:text-foreground"
    >
      <Sun className="size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
      <Moon className="absolute size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
    </Button>
  );
}
