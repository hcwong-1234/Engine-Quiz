// src/pages/Main.jsx
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider"; // <-- add this
import all from "../data/questions.json";

const QUESTION_COUNT = 25;
const pickNIds = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n).map(q => q.id);

export default function Main() {
  const nav = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth(); // <-- add this

  // hard guard: block render if not signed in
  if (loading) return null; // or a small spinner if you want
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  function begin() {
    const selectedIds = pickNIds(all, QUESTION_COUNT);
    localStorage.setItem("selected_ids", JSON.stringify(selectedIds));
    localStorage.setItem("answers", JSON.stringify({}));
    nav("/quiz/q/1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4
                    bg-gradient-to-r from-slate-100 via-blue-100 to-slate-200
                    dark:from-slate-800 dark:via-slate-900 dark:to-black
                    bg-[length:200%_200%] animate-gradientMove transition-colors">
      <section className="animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-xl w-full
                          bg-white/70 backdrop-blur-md
                          dark:bg-slate-800/70 dark:text-slate-100 dark:shadow-black/30
                          transition-colors">
        {/* Logo bar */}
        <div className="inline-block bg-green-600 px-6 py-2 rounded-md text-white
                        text-2xl font-bold tracking-widest shadow mb-6">
          DAIKAI
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-3">
          Quiz Instructions
        </h2>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Please read carefully before you begin.
        </p>

        {/* Instructions List */}
        <ul className="space-y-3 text-left text-slate-800 dark:text-slate-200">
          <li className="flex gap-3"><span>⏱️</span><span><b>30 minutes</b> total to complete the quiz.</span></li>
          <li className="flex gap-3"><span>🔁</span><span>You can move <b>Back</b> and <b>Next</b> anytime.</span></li>
          <li className="flex gap-3"><span>➡️</span><span>Click <b>Next</b> to proceed through questions.</span></li>
          <li className="flex gap-3"><span>📤</span><span>Click <b>Submit</b> on the last question to finish.</span></li>
          <li className="flex gap-3"><span>⏳</span><span>You may submit at any time before the timer ends.</span></li>
          <li className="flex gap-3"><span>🛑</span><span>Closing the page will <b>auto-submit</b> your responses.</span></li>
        </ul>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => nav("/login")}
            className="rounded-full border border-slate-300 dark:border-slate-600
                       px-12 py-2.5 text-slate-700 dark:text-slate-200
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Back
          </button>
          <button
            onClick={begin}
            className="rounded-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400
                       px-12 py-2.5 font-semibold text-white
                       shadow-lg transition-transform hover:scale-[1.02]">
            Start Test
          </button>
        </div>
      </section>
    </div>
  );
}
