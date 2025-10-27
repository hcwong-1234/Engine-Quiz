// src/pages/Results.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import all from "../data/questions.json";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";

export default function Results() {
  // ---------- Load attempt from localStorage ----------
  // New keys
  const presentedIdsRaw = localStorage.getItem("presented_ids");
  const answersOrderedRaw = localStorage.getItem("answers_ordered");

  // Legacy fallback (for older runs)
  const legacyIdsRaw = localStorage.getItem("selected_ids");
  const legacyAnswersRaw = localStorage.getItem("answers");

  // Parse with fallback
  const ids = useMemo(() => {
    const newIds = JSON.parse(presentedIdsRaw || "[]");
    if (Array.isArray(newIds) && newIds.length) return newIds;
    return JSON.parse(legacyIdsRaw || "[]");
  }, [presentedIdsRaw, legacyIdsRaw]);

  const answersByPos = useMemo(() => {
    const obj = JSON.parse(answersOrderedRaw || "{}");
    if (obj && typeof obj === "object" && Object.keys(obj).length) return obj;
    // build from legacy structure { [qid]: value } -> { q1: ans(ids[0]), q2: ... }
    const legacy = JSON.parse(legacyAnswersRaw || "{}");
    const byPos = {};
    ids.forEach((qid, i) => { byPos[`q${i + 1}`] = (legacy[qid] ?? "").trim(); });
    return byPos;
  }, [answersOrderedRaw, legacyAnswersRaw, ids]);

  // ---------- Build question objects in same order ----------
  const picked = useMemo(
    () => ids.map(id => all.find(q => q.id === id)).filter(Boolean),
    [ids]
  );

  // ---------- Score (by index) ----------
  const { correct, percent } = useMemo(() => {
    let c = 0;
    for (let i = 0; i < picked.length; i++) {
      const q = picked[i];
      const chosen = String(answersByPos[`q${i + 1}`] ?? "").trim();
      const right  = String(q?.answer ?? "").trim();
      if (chosen === right) c++;
    }
    const pct = picked.length ? Math.round((c / picked.length) * 100) : 0;
    return { correct: c, percent: pct };
  }, [picked, answersByPos]);

  // ---------- Save to Supabase ----------
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'
  const savedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || picked.length === 0 || savedRef.current) return;

    savedRef.current = true;
    setSaveStatus("saving");

    const quizName = "User's knowledge";

    const payload = {
      user_id: user.id,
      user_email: user.email ?? null,      // keep if your table has this column
      quiz_name: quizName,
      question_ids: ids,                   // ordered real IDs (Q1→Qn)
      answers_ordered: answersByPos,       // object: { q1: "...", q2: "..." }
      score: correct,
      total: picked.length,
      percentage: percent,
    };

    (async () => {
      const { error } = await supabase.from("quiz_results").insert([payload]).select();
      if (error) {
        console.error("Insert failed:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload,
        });
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    })();
  }, [user?.id, user?.email, picked.length, ids, answersByPos, correct, percent]);

  function SaveChip() {
    if (saveStatus === "saving") {
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 text-xs">
          Saving…
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 text-xs">
          Saved
        </span>
      );
    }
    if (saveStatus === "error") {
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 text-xs">
          Save failed
        </span>
      );
    }
    return null;
  }

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
          rounded-3xl shadow-xl p-8 md:p-10 max-w-3xl w-full transition-colors
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center">
            <div className="inline-block bg-green-600 dark:bg-green-600 px-4 py-1.5 rounded-md text-white text-lg font-bold tracking-widest shadow">
              DAIKAI
            </div>
            <SaveChip />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Attempt reviewed
          </div>
        </div>

        {/* Score card */}
        <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/60 p-6 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Results
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            You scored <b>{correct}</b> out of <b>{picked.length}</b>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                ${
                  percent >= 70
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
            >
              {percent}% {percent >= 70 ? "• Passed" : "• Review recommended"}
            </span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Per-question breakdown (ordered by index; maps Qn ↔ real qid) */}
        <div className="space-y-3">
          {picked.map((q, i) => {
            const chosen = String(answersByPos[`q${i + 1}`] ?? "").trim();
            const ok = chosen === String(q?.answer ?? "").trim();
            const qid = ids[i]; // real question id aligned to Q{i+1}
            return (
              <div
                key={qid}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/60 p-4 shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Q{i + 1} 
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
                      ${
                        ok
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                      }`}
                  >
                    {ok ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {q?.prompt ?? "Unknown question"}
                </div>
                <div className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                  Your answer: {chosen || <em>—</em>}
                </div>
                {!ok && (
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Correct: <b>{q?.answer}</b>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            className="
              rounded-full border border-slate-300 dark:border-slate-600
              px-5 py-2.5 text-slate-700 dark:text-slate-200
              hover:bg-slate-50 dark:hover:bg-slate-700 transition
            "
            onClick={() => {
              // clear new keys (and legacy for safety)
              localStorage.removeItem("presented_ids");
              localStorage.removeItem("answers_ordered");
              localStorage.removeItem("selected_ids");
              localStorage.removeItem("answers");
              location.href = "/main";
            }}
          >
            Retake
          </button>

          <button
            className="
              rounded-full bg-blue-700 hover:bg-blue-800
              dark:bg-blue-500 dark:hover:bg-blue-400
              px-6 py-2.5 font-semibold text-white shadow-lg
              transition-transform hover:scale-[1.02]
            "
            onClick={() => (location.href = "/")}
          >
            Back to Home
          </button>
        </div>
      </section>
    </div>
  );
}
