// src/pages/Quiz.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import all from "../data/questions.json";
import { supabase } from "@/lib/supabaseClient";

const LIMIT_MIN = 30; // 30-minute timer

const LS_SELECTED_IDS = "selected_ids";
const LS_PRESENTED_IDS = "presented_ids";
const LS_RUN_ID = "quiz_run_id";
const LS_RUN_FINGERPRINT = "quiz_run_fingerprint";

// Small helper to get a stable fingerprint for the chosen set/order
const fingerprint = (ids) => JSON.stringify(ids || []);
const answersKeyFor = (runId) => `answers_ordered::${runId}`;

export default function Quiz() {
  const { idx } = useParams();
  const nav = useNavigate();
  const i = Math.max(1, parseInt(idx || "1", 10)); // 1-based index

  // Selected IDs chosen on Main.jsx (this is already your display order)
  const selectedIds = JSON.parse(localStorage.getItem(LS_SELECTED_IDS) || "[]");

  // Save the exact display order of real IDs for Results (Q1..Qn mapping)
  useEffect(() => {
    if (selectedIds.length) {
      localStorage.setItem(LS_PRESENTED_IDS, JSON.stringify(selectedIds));
    }
  }, [selectedIds]);

  // Establish a runId that's tied to the current selectedIds.
  // If the fingerprint changes (new quiz selection/order), start a new run.
  const [runId] = useState(() => {
    const fpNow = fingerprint(selectedIds);
    const prevFp = localStorage.getItem(LS_RUN_FINGERPRINT);
    let rid = localStorage.getItem(LS_RUN_ID);

    if (!rid || fpNow !== prevFp) {
      rid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(LS_RUN_ID, rid);
      localStorage.setItem(LS_RUN_FINGERPRINT, fpNow);
      // clear any stale global key if it existed
      localStorage.removeItem("answers_ordered");
      // (optional) old namespaced keys can be ignored; we won't read them again
    }
    return rid;
  });

  // Map IDs to full question objects (memoized)
  const questions = useMemo(
    () => selectedIds.map((id) => all.find((q) => q.id === id)).filter(Boolean),
    [selectedIds]
  );
  const q = questions[i - 1];

  // Answers ORDERED BY POSITION (q1..qN), persisted to localStorage under this runId
  const ANSWERS_KEY = answersKeyFor(runId);
  const [answersOrdered, setAnswersOrdered] = useState(() =>
    JSON.parse(localStorage.getItem(ANSWERS_KEY) || "{}")
  );
  useEffect(() => {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answersOrdered));
  }, [answersOrdered, ANSWERS_KEY]);

  // Submit guard (prevents double-submit from timer and manual)
  const submittedRef = useRef(false);

  // Build answers-by-id, fill blanks as ""
  function normalizeAnswersById() {
    return Object.fromEntries(
      selectedIds.map((id, idx) => {
        const key = `q${idx + 1}`;
        const val = ((answersOrdered[key] ?? "") + "").trim();
        return [id, val];
      })
    );
  }

  async function finalize(reason = "manual") {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // 1) Normalize answers: unanswered → ""
    const answersById = normalizeAnswersById();

    // 2) Score
    const picked = selectedIds
      .map((id) => all.find((qq) => qq.id === id))
      .filter(Boolean);

    const correct = picked.reduce((n, qq) => {
      const chosen = answersById[qq.id] || "";
      const right = (qq.answer || "").trim();
      return n + (chosen === right ? 1 : 0);
    }, 0);

    const total = picked.length;
    const percentage = total ? Math.round((correct / total) * 100) : 0;

    // 3) Persist locally for Results page
    localStorage.setItem(LS_SELECTED_IDS, JSON.stringify(selectedIds));
    localStorage.setItem(LS_PRESENTED_IDS, JSON.stringify(selectedIds));
    localStorage.setItem("answers", JSON.stringify(answersById));
    localStorage.setItem(answersKeyFor(runId), JSON.stringify(answersOrdered));

    // 4) Save to Supabase if logged in (safe no-op if not)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("quiz_results").insert({
          user_id: user.id,
          quiz_name: "Engine Quiz", // change if you have a dynamic name
          question_ids: selectedIds, // text[]
          answers: answersById, // jsonb (blanks are "")
          score: correct,
          total,
          percentage,
        });
        if (error) console.error("Save error:", error);
      }
    } catch (e) {
      console.error("Auth/Save error:", e);
    }

    // 5) Go to results
    nav("/results");
  }

  // Timer → auto-submit at 0 (forces blanks)
  const [left, setLeft] = useState(LIMIT_MIN * 60);
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          finalize("timeout"); // ⏲️ time’s up → submit with blanks
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]); // `finalize` is stable enough for this effect

  // Early loading state
  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-charcoal dark:bg-gunmetal transition-colors duration-500">
        <section className="animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-xl w-full text-center bg-alice dark:bg-charcoal text-gunmetal dark:text-alice shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5 backdrop-blur-md transition-all duration-500">
          <p>Loading…</p>
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

  // Current choice & helpers (strict)
  const chosen = ((answersOrdered[`q${i}`] ?? "") + "").trim();
  const hasChoice = chosen.length > 0;

  // Route guard: don't allow opening q>1 if previous is unanswered (prevents URL skipping)
  useEffect(() => {
    if (i > 1) {
      const prevKey = `q${i - 1}`;
      const prevAns = ((answersOrdered[prevKey] ?? "") + "").trim();
      if (!prevAns) {
        nav(`/quiz/q/${i - 1}`, { replace: true });
      }
    }
  }, [i, answersOrdered, nav]);

  function pick(opt) {
    const key = `q${i}`;
    setAnswersOrdered((a) => ({ ...a, [key]: opt }));
  }

  function prev() {
    if (i > 1) nav(`/quiz/q/${i - 1}`);
  }

  // Progress & timer formatting
  const progress = (i / questions.length) * 100;
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");

  // Resolve /public paths even under subpaths
  const fromPublic = (p) =>
    p ? (p.startsWith("/") ? `${import.meta.env.BASE_URL}${p.slice(1)}` : p) : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-charcoal dark:bg-gunmetal transition-colors duration-500">
      <section className="animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-2xl w-full bg-alice dark:bg-charcoal text-gunmetal dark:text-alice shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5 backdrop-blur-md transition-all duration-500">
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
          <div>
            Question <b>{i}</b> / {questions.length}
          </div>
          <div>{Math.round(progress)}%</div>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-charcoal dark:bg-glaucous transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question + (optional) image */}
        <div className="mb-6">
          <h3 className="text-lg md:text-l font-semibold mb-3 whitespace-pre-line leading-normal">
            {q.prompt}
          </h3>
          {q.image && (
            <figure className="rounded-xl overflow-hidden bg-white/60 shadow border border-black/5">
              <img
                src={fromPublic(q.image)}
                alt="Question illustration"
                className="w-full max-h-40 object-contain bg-white"
                onError={(e) => e.currentTarget.closest("figure")?.remove()}
              />
            </figure>
          )}
        </div>

        {/* Options */}
        <div className="grid gap-3">
          {q.options.map((opt) => {
            const active = chosen === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(opt)}
                className={[
                  "text-left rounded-xl border p-3 md:p-4 transition shadow-sm",
                  "hover:border-glaucous hover:bg-glaucous/10",
                  "dark:hover:border-glaucous dark:hover:bg-glaucous/15",
                  active
                    ? "border-glaucous bg-glaucous/15 ring-1 ring-glaucous/30"
                    : "border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-700/60",
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
            type="button"
            onClick={prev}
            className="rounded-full border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40"
            disabled={i === 1}
          >
            Back
          </button>

          {i < questions.length ? (
            <button
              type="button"
              onClick={hasChoice ? () => nav(`/quiz/q/${i + 1}`) : undefined}
              disabled={!hasChoice}
              aria-disabled={!hasChoice}
              className="
                rounded-full px-6 py-2.5 font-semibold text-white shadow-lg
                bg-charcoal hover:opacity-90
                dark:bg-glaucous dark:hover:opacity-90
                transition-transform hover:scale-[1.02]
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={hasChoice ? () => finalize("manual") : undefined}
              disabled={!hasChoice}
              aria-disabled={!hasChoice}
              className="
                rounded-full px-6 py-2.5 font-semibold text-white shadow-lg
                bg-emerald-600 hover:bg-emerald-700
                dark:bg-emerald-500 dark:hover:opacity-90
                transition-transform hover:scale-[1.02]
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              Submit
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
