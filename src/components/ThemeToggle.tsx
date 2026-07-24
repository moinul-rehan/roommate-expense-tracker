"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "theme";
type Theme = "light" | "dark";

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme | null {
  return null;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

/** Placed beside the notification bell. Reads the theme the blocking inline
 * script in the root layout already applied to <html> — nothing flashes on
 * mount, only the icon itself resolves once the client can read the DOM. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-[42px] shrink-0 items-center justify-center rounded-full border border-border bg-card"
    >
      {theme === "dark" ? (
        <Sun className="size-5 text-foreground" />
      ) : theme === "light" ? (
        <Moon className="size-5 text-foreground" />
      ) : (
        <span className="size-5" />
      )}
    </button>
  );
}
