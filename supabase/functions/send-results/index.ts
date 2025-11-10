// functions/send-results/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// CORS helper
function cors(json: unknown, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      // ✅ explicit CORS headers for browsers
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  // Handle preflight (OPTIONS)
  if (req.method === "OPTIONS") return cors({ ok: true });

  try {
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY secret");
      return cors({ ok: false, error: "Missing RESEND_API_KEY" }, 500);
    }

    // Parse request body
    const { to, score, total, percentage, reviewUrl, html } = await req.json();

    if (!to) return cors({ ok: false, error: "`to` is required" }, 400);
    if (typeof score !== "number" || typeof total !== "number") {
      return cors({ ok: false, error: "`score` and `total` must be numbers" }, 400);
    }

    const subject = "Your DAIKAI Quiz Results";
    const fallbackHtml = `
      <h2>DAIKAI Quiz Results</h2>
      <p><b>Score:</b> ${score} / ${total} (${percentage || Math.round((score / total) * 100)}%)</p>
      ${reviewUrl ? `<p>View details: <a href="${reviewUrl}">${reviewUrl}</a></p>` : ""}
    `;

    // Send via Resend
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DAIKAI Quiz <quiz@daikai.com>", // replace with verified sender if you have one
        to,
        subject,
        html: html || fallbackHtml,
      }),
    });

    // Handle Resend API error
    if (!r.ok) {
      const err = await r.json().catch(() => null);
      console.error("Resend API error", err);
      return cors({ ok: false, error: "Resend error", details: err }, 500);
    }

    const data = await r.json().catch(() => ({}));
    return cors({ ok: true, id: data?.id || null });
  } catch (e) {
    console.error("send-results crashed:", e);
    return cors({ ok: false, error: String(e) }, 500);
  }
});
