import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("thoughts-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefers);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        localStorage.setItem("thoughts-theme", next ? "dark" : "light");
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full bg-card p-2.5 text-foreground ring-1 ring-border"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
