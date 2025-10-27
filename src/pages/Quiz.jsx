// src/pages/Quiz.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import all from "../data/questions.json";
import { supabase } from "@/lib/supabaseClient";

const LIMIT_MIN = 30; // 30-minute timer

export default function Quiz() {
  const { idx } = useParams();
  const nav = useNavigate();
  const i = Math.max(1, parseInt(idx || "1", 10));

  // Selected IDs chosen on Main.jsx
  const selectedIds = JSON.parse(localStorage.getItem("selected_ids") || "[]");

  // Map IDs to full question objects (memoized)
  const questions = useMemo(
    () => selectedIds.map(id => all.find(q => q.id === id)).filter(Boolean),
    [selectedIds]
  );
  const q = questions[i - 1];

  // Answers (persist to localStorage)
  const [answers, setAnswers] = useState(
    () => JSON.parse(localStorage.getItem("answers") || "{}")
  );

  // Timer → auto-submit at 0
  const [left, setLeft] = useState(LIMIT_MIN * 60);
  useEffect(() => {
    const id = setInterval(() => {
      setLeft(s => {
        if (s <= 1) { clearInterval(id); nav("/results"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [nav]);

  if (!q) {
    return (
      <div
        className="
          min-h-screen flex items-center justify-center px-4
          bg-gradient-to-r from-slate-100 via-blue-100 to-slate-200
          dark:from-slate-800 dark:via-slate-900 dark:to-black
          bg-[length:200%_200%] animate-gradientMove transition-colors
        "
      >
        <section className="animate-fadeIn bg-white/70 dark:bg-slate-800/70 dark:text-slate-100 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-10 max-w-xl w-full text-center">
          <p className="text-slate-800 dark:text-slate-100">Loading…</p>
          <button
            className="mt-4 rounded-full border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            onClick={() => nav("/main")}
          >
            Back to Instructions
          </button>
        </section>
      </div>
    );
  }

  const chosen = answers[q.id];
  const m = Math.floor(left / 60), s = String(left % 60).padStart(2, "0");

  function pick(opt) {
    const next = { ...answers, [q.id]: opt };
    setAnswers(next);
    localStorage.setItem("answers", JSON.stringify(next));
  }

  function prev()  { if (i > 1) nav(`/quiz/q/${i - 1}`); }
  function next()  { if (i < questions.length) nav(`/quiz/q/${i + 1}`); }
  function submit(){ nav("/results"); }

  const progress = (i / questions.length) * 100;

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-gradient-to-r from-slate-100 via-blue-100 to-slate-200
        dark:from-slate-800 dark:via-slate-900 dark:to-black
        bg-[length:200%_200%] animate-gradientMove transition-colors
      "
    >
      <section
        className="
          animate-fadeIn bg-white/70 dark:bg-slate-800/70 dark:text-slate-100 backdrop-blur-md
          rounded-3xl shadow-xl p-8 md:p-10 max-w-2xl w-full
          transition-colors
        "
      >
        {/* Top bar: logo + timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block bg-green-600 dark:bg-green-600 px-4 py-1.5 rounded-md text-white text-lg font-bold tracking-widest shadow">
            DAIKAI
          </div>
          <div className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
            ⏱ {m}:{s}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <div>Question <b>{i}</b> / {questions.length}</div>
          <div>{Math.round(progress)}%</div>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
          {q.prompt}
        </h3>

        {/* Options */}
        <div className="grid gap-3">
          {q.options.map(opt => {
            const active = chosen === opt;
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                className={[
                  "text-left rounded-xl border p-3 md:p-4 transition shadow-sm",
                  // hover states
                  "hover:border-blue-300 hover:bg-blue-50/50",
                  "dark:hover:border-blue-400 dark:hover:bg-blue-500/10",
                  // base states
                  active
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200 dark:border-blue-400 dark:bg-blue-500/20 dark:ring-blue-500/30"
                    : "border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-700/60"
                ].join(" ")}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            className="rounded-full border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40"
            disabled={i === 1}
          >
            Back
          </button>

          {i < questions.length ? (
            <button
              onClick={next}
              className="rounded-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400 px-6 py-2.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
              disabled={!chosen}
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-6 py-2.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
              disabled={!chosen}
            >
              Submit
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
