// src/App.jsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function App() {
  const [dark, setDark] = useState(
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
  );
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div
      className={[
        // exact device viewport height, no page scroll here
        "min-h-[100dvh]",
        "bg-gradient-to-r bg-[length:200%_200%] animate-gradientMove transition-colors",
        dark
          ? "from-slate-800 via-slate-900 to-black text-slate-100"
          : "from-slate-100 via-blue-100 to-slate-200 text-slate-900",
      ].join(" ")}
    >
      {/* Floating theme toggle - always visible */}
      <div
        className="
          fixed z-50
          right-[calc(env(safe-area-inset-right)+16px)]
          top-[calc(env(safe-area-inset-top)+16px)]
        "
      >
        <button
          onClick={() => setDark(d => !d)}
          className="rounded-full border border-slate-300 dark:border-slate-600 p-2
                     bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700
                     shadow-md transition"
          aria-label="Toggle theme"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Pages render full-bleed; each page handles its own centering/scrolling */}
      <Outlet />
    </div>
  );
}
