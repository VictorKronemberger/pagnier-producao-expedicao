"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      className="button theme-toggle"
      aria-label="Alternar entre modo claro e escuro"
      title="Alternar entre modo claro e escuro"
      onClick={() => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")}
    >
      <Moon className="theme-light-icon" size={17} aria-hidden="true" />
      <Sun className="theme-dark-icon" size={17} aria-hidden="true" />
      <span className="theme-light-icon theme-toggle-label">Modo escuro</span>
      <span className="theme-dark-icon theme-toggle-label">Modo claro</span>
    </button>
  );
}
