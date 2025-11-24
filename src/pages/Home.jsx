// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import engineImg from "../assets/engine.webp";

export default function Home() {
  const nav = useNavigate();

  return (
    <div
      className="
        min-h-screen flex items-center justify-center text-center px-4
        bg-charcoal dark:bg-gunmetal
        dark:bg-gradient-to-b dark:from-gunmetal dark:via-gunmetal dark:to-charcoal
        transition-colors duration-500
      "
    >
      <div
        className="
          animate-fadeIn rounded-3xl p-8 md:p-10 max-w-xl w-full
          bg-alice dark:bg-charcoal
          text-gunmetal dark:text-alice
          shadow-xl shadow-slate-900/10 dark:shadow-black/30
          dark:ring-1 dark:ring-white/5
          transition-all duration-500
        "
      >
        {/* Logo */}
        <div
          className="
            inline-block px-6 py-2 rounded-md text-white text-2xl font-bold tracking-widest shadow mb-6
            bg-green-600
          "
        >
          DAIKAI
        </div>

        {/* Image */}
        <img
          src={engineImg}
          alt="Daihatsu Engine"
          className="mx-auto w-[220px] md:w-[320px] mb-8 drop-shadow-xl"
        />

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
          ENGINE BASIC KNOWLEDGE TEST
        </h1>

        {/* Subtitle (make secondary text readable in dark) */}
        <p className="text-paynes dark:text-glaucous mb-8">
          Test your understanding of engine fundamentals in this 30-minute quiz.
        </p>

        {/* CTA — use glaucous in dark so it stands out from the charcoal card */}
        <button
          onClick={() => nav("/login")}
          className="
            px-8 py-3 rounded-full font-semibold shadow-lg transition-transform hover:scale-105
            bg-charcoal text-white hover:opacity-90
            dark:bg-glaucous dark:text-white
          "
        >
          Get Started
        </button>

        <p className="text-xs text-paynes dark:text-glaucous mt-8">
          © {new Date().getFullYear()} Daikai Technology Pte Ltd
        </p>
      </div>
    </div>
  );
}
