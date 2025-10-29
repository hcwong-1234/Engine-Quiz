// src/pages/Quiz.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import all from "../data/questions.json";
import { supabase } from "@/lib/supabaseClient";

const LIMIT_MIN = 30; // 30-minute timer

export default function Quiz() {
  const { idx } = useParams();
  const nav = useNavigate();
  const i = Math.max(1, parseInt(idx || "1", 10)); // 1-based index for display/Q-number

  // Selected IDs chosen on Main.jsx (this is already your display order)
  const selectedIds = JSON.parse(localStorage.getItem("selected_ids") || "[]");

  // 🔹 Save the exact display order of real IDs for Results (Q1..Qn mapping)
  useEffect(() => {
    if (selectedIds.length) {
      localStorage.setItem("presented_ids", JSON.stringify(selectedIds));
    }
  }, [selectedIds]);

  // Map IDs to full question objects (memoized)
  const questions = useMemo(
    () => selectedIds.map(id => all.find(q => q.id === id)).filter(Boolean),
    [selectedIds]
  );
  const q = questions[i - 1];

  // 🔹 Answers ORDERED BY POSITION (q1..q25), persisted to localStorage
  // shape: { q1: "I and II", q2: "All of the above", ... }
  const [answersOrdered, setAnswersOrdered] = useState(
    () => JSON.parse(localStorage.getItem("answers_ordered") || "{}")
  );
  useEffect(() => {
    localStorage.setItem("answers_ordered", JSON.stringify(answersOrdered));
  }, [answersOrdered]);

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
          bg-charcoal dark:bg-gunmetal
          transition-colors duration-500
        "
      >
        <section
          className="
            animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-xl w-full text-center
            bg-alice dark:bg-charcoal
            text-gunmetal dark:text-alice
            shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5
            backdrop-blur-md transition-all duration-500
          "
        >
          <p>Loading…</p>
          <button
            className="
              mt-4 rounded-full border border-slate-300 dark:border-slate-600
              px-5 py-2.5 text-slate-700 dark:text-slate-200
              hover:bg-slate-50 dark:hover:bg-slate-700 transition
            "
            onClick={() => nav("/main")}
          >
            Back to Instructions
          </button>
        </section>
      </div>
    );
  }

  // 🔹 Chosen answer is read by POSITION key (q{index})
  const chosen = answersOrdered[`q${i}`];
  const m = Math.floor(left / 60), s = String(left % 60).padStart(2, "0");

  // 🔹 Save answer by POSITION (q{index}) — NOT by q.id
  function pick(opt) {
    const key = `q${i}`; // e.g., q1, q2, ...
    const next = { ...answersOrdered, [key]: opt };
    setAnswersOrdered(next);
  }

  function prev()  { if (i > 1) nav(`/quiz/q/${i - 1}`); }
  function next()  { if (i < questions.length) nav(`/quiz/q/${i + 1}`); }
  function submit(){ nav("/results"); }

  const progress = (i / questions.length) * 100;

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-charcoal dark:bg-gunmetal
        transition-colors duration-500
      "
    >
      <section
        className="
          animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-2xl w-full
          bg-alice dark:bg-charcoal
          text-gunmetal dark:text-alice
          shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5
          backdrop-blur-md transition-all duration-500
        "
      >
        {/* Top bar: logo + timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-block bg-green-600 px-4 py-1.5 rounded-md text-white text-lg font-bold tracking-widest shadow">
            DAIKAI
          </div>
          <div className="text-sm md:text-base font-semibold">
            ⏱ {m}:{s}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-sm text-paynes dark:text-glaucous">
          <div>Question <b>{i}</b> / {questions.length}</div>
          <div>{Math.round(progress)}%</div>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-charcoal dark:bg-glaucous transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="text-lg md:text-xl font-semibold mb-4">
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
                  // hover states (use glaucous accents)
                  "hover:border-glaucous hover:bg-glaucous/10",
                  "dark:hover:border-glaucous dark:hover:bg-glaucous/15",
                  // base states
                  active
                    ? "border-glaucous bg-glaucous/15 ring-1 ring-glaucous/30"
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
            className="
              rounded-full border border-slate-300 dark:border-slate-600
              px-5 py-2.5 text-slate-700 dark:text-slate-200
              hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40
            "
            disabled={i === 1}
          >
            Back
          </button>

          {i < questions.length ? (
            <button
              onClick={next}
              className="
                rounded-full px-6 py-2.5 font-semibold text-white shadow-lg
                bg-charcoal hover:opacity-90
                dark:bg-glaucous dark:hover:opacity-90
                transition-transform hover:scale-[1.02] disabled:opacity-50
              "
              disabled={!chosen}
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              className="
                rounded-full px-6 py-2.5 font-semibold text-white shadow-lg
                bg-emerald-600 hover:bg-emerald-700
                dark:bg-emerald-500 dark:hover:bg-emerald-400
                transition-transform hover:scale-[1.02] disabled:opacity-50
              "
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
