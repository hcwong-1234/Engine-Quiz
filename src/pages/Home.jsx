// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import engineImg from "../assets/engine.webp";

export default function Home() {
  const nav = useNavigate();

  return (

    <div
      className="
        min-h-screen flex items-center justify-center text-center px-4
        bg-gradient-to-r from-slate-100 via-blue-100 to-slate-200
        bg-[length:200%_200%] animate-gradientMove
        dark:from-slate-800 dark:via-slate-900 dark:to-black
        transition-colors
      "
    >
      <div
        className="
          animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-xl w-full
          bg-white/70 backdrop-blur-md
          dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-black/20
          transition-colors
        "
      >
        {/* Logo */}
        <div
          className="
            inline-block px-6 py-2 rounded-md text-white text-2xl font-bold tracking-widest shadow mb-6
            bg-green-600 dark:bg-green-600
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
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-3">
          DAIKAI ENGINE BASIC KNOWLEDGE TEST
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-8">
          Test your understanding of Daikai engine fundamentals in this 30-minute quiz.
        </p>

        {/* CTA */}
        <button
          onClick={() => nav("/login")}
          className="
            px-8 py-3 rounded-full font-semibold shadow-lg transition-transform hover:scale-105
            bg-blue-700 hover:bg-blue-800 text-white
            dark:bg-blue-500 dark:hover:bg-blue-400
          "
        >
          Get Started
        </button>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-8">
          © {new Date().getFullYear()} Daikai Technology Pte Ltd
        </p>
      </div>
    </div>
  );
}
