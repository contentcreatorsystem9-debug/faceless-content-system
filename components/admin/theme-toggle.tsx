"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "creator-tool-admin-theme";

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = light ? "light" : "dark";
  }, [light]);

  function toggle() {
    const nextLight = !light;
    window.localStorage.setItem(STORAGE_KEY, nextLight ? "light" : "dark");
    window.dispatchEvent(new Event("creator-tool-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl border border-white/10 p-2.5 transition"
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("creator-tool-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("creator-tool-theme-change", onChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "light";
}

function getServerSnapshot() {
  return false;
}
