import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");

  // 🔹 track if magic link has been sent
  const [linkSent, setLinkSent] = useState(false);

  async function signInWithGoogle(e) {
    e?.preventDefault();
    if (linkSent) return; // safety: ignore if page is frozen
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/main" },
      });
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  async function sendMagicLink(e) {
    e?.preventDefault();
    if (linkSent) return; // safety: ignore if page is frozen
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + "/main" },
      });
      if (error) throw error;
      setMsg("Check your email for the sign-in link.");
      // ✅ freeze this page
      setLinkSent(true);
    } catch (e) {
      setErr(e?.message || "Failed to send link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-4
        bg-charcoal dark:bg-gunmetal
        transition-colors duration-500
      "
    >
      <div
        className="
          animate-fadeIn rounded-3xl shadow-xl p-8 md:p-10 max-w-md w-full text-center
          bg-alice dark:bg-charcoal
          text-gunmetal dark:text-alice
          shadow-slate-900/10 dark:shadow-black/30 dark:ring-1 dark:ring-white/5
          backdrop-blur-md transition-all duration-500
        "
      >
        {/* Logo */}
        <div
          className="
            inline-block bg-green-600 px-6 py-2 rounded-md text-white
            text-2xl font-bold tracking-widest shadow mb-6
          "
        >
          DAIKAI
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
          Sign in to start
        </h2>
        <p className="text-paynes dark:text-glaucous mb-6">
          {linkSent
            ? "We’ve sent a secure link to your inbox."
            : useEmail
            ? "We’ll email you a link."
            : "Continue with your Google account or email."}
        </p>

        {/* 🔹 AFTER link is sent: freeze UI */}
        {linkSent ? (
          <>
            <div
              className="
                mt-2 rounded-2xl
                border border-emerald-400/40 dark:border-emerald-500/40
                bg-emerald-50 dark:bg-emerald-500/10
                px-5 py-4
                text-emerald-700 dark:text-emerald-200
                shadow-sm
              "
            >
              <p className="font-semibold">
                Check your email for the sign-in link.
              </p>
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-100/80">
                 You can safely close this tab after you&apos;ve clicked it.
              </p>
            </div>

          </>
        ) : (
          /* 🔹 BEFORE link is sent: normal form */
          <form
            onSubmit={useEmail ? sendMagicLink : signInWithGoogle}
            className="space-y-4"
          >
            {/* Email mode */}
            {useEmail && (
              <div className="text-left mb-2">
                <label className="block text-sm font-medium text-paynes dark:text-glaucous mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full rounded-xl border p-3 outline-none transition
                    bg-white/90 dark:bg-slate-700/60
                    focus:ring-2 focus:ring-glaucous focus:border-glaucous
                    dark:focus:ring-glaucous border-slate-300 dark:border-slate-600
                  "
                />
              </div>
            )}

            {/* Primary action */}
            <div className="mt-2 flex flex-col gap-3">
              {!useEmail ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    rounded-full bg-white/90 dark:bg-slate-700/60
                    border border-slate-300 dark:border-slate-600
                    px-6 py-2.5 font-semibold text-slate-800 dark:text-slate-100
                    shadow-lg transition-transform hover:scale-[1.02] hover:bg-white
                    disabled:opacity-60 flex items-center justify-center gap-2
                  "
                >
                  {/* Google 'G' icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3C33.5 31.7 29.1 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.1 7 28.8 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c10 0 19-7.3 19-20 0-1.4-.1-2.8-.4-4.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.3 14.7l6.6 4.8C14.6 16.2 19 13 24 13c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.1 7 28.8 5 24 5 16.5 5 9.9 9.1 6.3 14.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 45c5 0 9.6-1.9 13.1-5.1l-6-4.9C29.1 35 26.7 36 24 36c-5.1 0-9.4-3.3-11-7.8l-6.7 5.2C9.9 40.9 16.5 45 24 45z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.2 5.1-6.2 6.1l6 4.9C37.6 36.9 40 31.7 40 25c0-1.6-.2-3.2-.4-4.5z"
                    />
                  </svg>
                  {loading ? "Connecting…" : "Continue with Google"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    rounded-full bg-charcoal dark:bg-glaucous text-white
                    px-6 py-2.5 font-semibold shadow-lg
                    transition-transform hover:scale-[1.02] hover:opacity-90 disabled:opacity-60
                  "
                >
                  {loading ? "Sending link…" : "Send link"}
                </button>
              )}

              {/* Switch method */}
              <button
                type="button"
                onClick={() => {
                  setUseEmail(!useEmail);
                  setErr("");
                  setMsg("");
                }}
                className="
                  rounded-full border border-slate-300 dark:border-slate-600
                  px-5 py-2.5 text-slate-700 dark:text-slate-200
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition
                "
              >
                {useEmail ? "Use Google instead" : "Login with Email"}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => nav("/")}
                className="
                  rounded-full border border-slate-300 dark:border-slate-600
                  px-5 py-2.5 text-slate-700 dark:text-slate-200
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition
                "
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Messages */}
        {err && (
          <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {err}
          </p>
        )}
        {!linkSent && msg && (
          <p className="mt-4 text-sm text-green-600">{msg}</p>
        )}
      </div>
    </div>
  );
}
