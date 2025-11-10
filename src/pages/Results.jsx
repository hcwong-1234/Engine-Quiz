import { useEffect, useRef, useState, useMemo } from "react";
import all from "../data/questions.json";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";

export default function Results() {
  // ---------- Load attempt from localStorage ----------
  const presentedIdsRaw = localStorage.getItem("presented_ids");
  const legacyIdsRaw = localStorage.getItem("selected_ids");
  const legacyAnswersRaw = localStorage.getItem("answers");

  // 🔹 NEW: support namespaced answers per run
  const runId = localStorage.getItem("quiz_run_id") || "";
  const answersKey = runId ? `answers_ordered::${runId}` : "answers_ordered";
  const answersOrderedRaw =
    localStorage.getItem(answersKey) ||
    localStorage.getItem("answers_ordered") || // legacy fallback
    null;

  const ids = useMemo(() => {
    const newIds = JSON.parse(presentedIdsRaw || "[]");
    if (Array.isArray(newIds) && newIds.length) return newIds;
    return JSON.parse(legacyIdsRaw || "[]");
  }, [presentedIdsRaw, legacyIdsRaw]);

  const answersByPos = useMemo(() => {
    const obj = JSON.parse(answersOrderedRaw || "{}");
    if (obj && typeof obj === "object" && Object.keys(obj).length) return obj;

    // Legacy fallback: convert id-keyed answers -> position-keyed (q1, q2, ...)
    const legacy = JSON.parse(legacyAnswersRaw || "{}");
    const byPos = {};
    ids.forEach((qid, i) => {
      byPos[`q${i + 1}`] = (legacy[qid] ?? "").trim();
    });
    return byPos;
  }, [answersOrderedRaw, legacyAnswersRaw, ids]);

  const picked = useMemo(
    () => ids.map((id) => all.find((q) => q.id === id)).filter(Boolean),
    [ids]
  );

  // ---------- Score ----------
  const { correct, percent } = useMemo(() => {
    let c = 0;
    for (let i = 0; i < picked.length; i++) {
      const q = picked[i];
      const chosen = String(answersByPos[`q${i + 1}`] ?? "").trim();
      const right = String(q?.answer ?? "").trim();
      if (chosen === right) c++;
    }
    const pct = picked.length ? Math.round((c / picked.length) * 100) : 0;
    return { correct: c, percent: pct };
  }, [picked, answersByPos]);

  // ---------- Save to Supabase ----------
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState("idle");
  const savedRef = useRef(false);

  // Email status + one-shot guard
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (!user?.id || picked.length === 0 || savedRef.current) return;
    savedRef.current = true;
    setSaveStatus("saving");

    const payload = {
      user_id: user.id,
      user_email: user.email ?? null,
      quiz_name: "User's knowledge",
      question_ids: ids,
      answers_ordered: answersByPos, // matches your table column
      score: correct,
      total: picked.length,
      percentage: percent,
    };

    (async () => {
      const { error } = await supabase
        .from("quiz_results")
        .insert([payload])
        .select();

      if (error) {
        console.error("Insert failed:", error);
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");

      // ---- Send result email once ----
// ---- Send result email once ----
// ---- Send result email once ----
if (!emailSentRef.current && user?.email) {
  emailSentRef.current = true;
  setEmailStatus("sending");

  try {
    const reviewUrl =
      window.location.origin + "/results" + (runId ? `?run=${runId}` : "");

    const { data, error } = await supabase.functions.invoke("send-results", {
      body: {
        to: user.email,
        score: correct,
        total: picked.length,
        percentage: percent,
        reviewUrl,
        // html: `<h2>DAIKAI Quiz Results</h2>
        //        <p><b>Score:</b> ${correct}/${picked.length} (${percent}%)</p>`
      },
    });

    if (error) throw error;
    setEmailStatus("sent");
  } catch (e) {
  // ⬇️ These logs show the exact payload your Edge Function returned
  console.error("Email send failed:", {
    name: e?.name,
    message: e?.message,
    status: e?.context?.status,
    body: e?.context ?? null,   // should include { ok:false, error, details }
  });
  setEmailStatus("error");
}
}


    })();
  }, [
    user?.id,
    user?.email,
    picked.length,
    ids,
    answersByPos,
    correct,
    percent,
    runId,
  ]);

  // ---------- Status chips ----------
  function SaveChip() {
    if (saveStatus === "saving")
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 text-xs">
          Saving…
        </span>
      );
    if (saveStatus === "saved")
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 text-xs">
          Saved
        </span>
      );
    if (saveStatus === "error")
      return (
        <span className="ml-3 inline-flex items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 text-xs">
          Save failed
        </span>
      );
    return null;
  }

  function EmailChip() {
    if (emailStatus === "sending")
      return (
        <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 px-2 py-0.5 text-xs">
          Emailing…
        </span>
      );
    if (emailStatus === "sent")
      return (
        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 text-xs">
          Email sent
        </span>
      );
    if (emailStatus === "error")
      return (
        <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 text-xs">
          Email failed
        </span>
      );
    return null;
  }

  // Toggle whether to reveal the correct answer when the user is wrong
  const REVEAL_CORRECT_IF_WRONG = false;

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
          animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-3xl w-full
          bg-alice dark:bg-charcoal
          text-gunmetal dark:text-alice
          shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5
          backdrop-blur-md transition-all duration-500
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center">
            <div className="inline-block bg-green-600 px-4 py-1.5 rounded-md text-white text-lg font-bold tracking-widest shadow">
              DAIKAI
            </div>
            <SaveChip />
            <EmailChip />
          </div>
          <div className="text-sm text-paynes dark:text-glaucous">
            Attempt reviewed
          </div>
        </div>

        {/* Score card */}
        <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/60 p-6 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            Results
          </h2>
          <p className="text-paynes dark:text-glaucous">
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
              className="h-2 rounded-full bg-charcoal dark:bg-glaucous transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          {picked.map((q, i) => {
            const chosen = String(answersByPos[`q${i + 1}`] ?? "").trim();
            const ok = chosen === String(q?.answer ?? "").trim();
            const qid = ids[i];
            return (
              <div
                key={qid}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/60 p-4 shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm text-paynes dark:text-glaucous">
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

                <div className="font-medium mb-1">
                  {q?.prompt ?? "Unknown question"}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Your answer:</span>{" "}
                  <span
                    className={
                      ok
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {chosen || <em>—</em>}
                  </span>
                </div>

                {!ok && REVEAL_CORRECT_IF_WRONG && (
                  <div className="text-sm mt-1">
                    <span className="font-semibold">Correct answer:</span>{" "}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {q?.answer}
                    </span>
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
              px-6 py-2.5 text-slate-700 dark:text-slate-200
              hover:bg-slate-50 dark:hover:bg-slate-700 transition
            "
            onClick={() => {
              // 🔹 Clear both legacy and namespaced keys
              localStorage.removeItem("presented_ids");
              localStorage.removeItem("answers_ordered");
              localStorage.removeItem("selected_ids");
              localStorage.removeItem("answers");
              localStorage.removeItem("quiz_run_id");
              localStorage.removeItem("quiz_run_fingerprint");
              // also clear the namespaced answers for this run if present
              if (runId) localStorage.removeItem(`answers_ordered::${runId}`);
              location.href = "/main";
            }}
          >
            Retake
          </button>

          <button
            className="
              rounded-full px-6 py-2.5 font-semibold text-white shadow-lg
              bg-charcoal hover:opacity-90
              dark:bg-glaucous dark:hover:opacity-90
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
