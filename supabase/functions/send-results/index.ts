// functions/send-results/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ---- Provider config (set via Supabase secrets) ----
const MAIL_PROVIDER   = (Deno.env.get("MAIL_PROVIDER") || "sendgrid").toLowerCase(); // "sendgrid" | "resend"
const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY") || "";
const SENDGRID_API_KEY= Deno.env.get("SENDGRID_API_KEY") || "";
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL") || "DAIKAI Quiz <hc_wong@daikai.com>";

// CORS helper
function cors(json: unknown, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors({ ok: true });

  try {
    const { to, score, total, percentage, reviewUrl, html } = await req.json();
    if (!to) return cors({ ok: false, error: "`to` is required" }, 400);
    if (typeof score !== "number" || typeof total !== "number") {
      return cors({ ok: false, error: "`score` and `total` must be numbers" }, 400);
    }
    console.log("send-results provider:", MAIL_PROVIDER, "from:", FROM_EMAIL);


    const pct = percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
    const subject = "Your DAIKAI Quiz Results";
    const fallbackHtml = `
      <h2>DAIKAI Quiz Results</h2>
      <p><b>Score:</b> ${score} / ${total} (${pct}%)</p>
      ${reviewUrl ? `<p>View details: <a href="${reviewUrl}">${reviewUrl}</a></p>` : ""}
    `;

    // Parse "Name <email>" to what SendGrid prefers
    const match = FROM_EMAIL.match(/^\s*(?:"?([^"]+)"?\s*)?<([^>]+)>\s*$/);
    const fromName = match?.[1] || "DAIKAI Quiz";
    const fromEmail = match?.[2] || FROM_EMAIL;

    // ---- Provider switch ----
    if (MAIL_PROVIDER === "sendgrid") {
      if (!SENDGRID_API_KEY) {
        console.error("Missing SENDGRID_API_KEY secret");
        return cors({ ok: false, error: "Missing SENDGRID_API_KEY" }, 500);
      }

      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              // optional: categories for analytics
              // dynamic_template_data: {}
            },
          ],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [{ type: "text/html", value: html || fallbackHtml }],
        }),
      });

      if (!sgRes.ok) {
        const details = await sgRes.text().catch(() => "");
        console.error("SendGrid API error", sgRes.status, details);
        return cors({ ok: false, error: "SendGrid error", details }, 500);
      }

      // SendGrid doesn't return an id in this endpoint; accepted if 2xx
      return cors({ ok: true, provider: "sendgrid" });
    }

    // Default: Resend (requires verified domain to send to anyone)
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY secret");
      return cors({ ok: false, error: "Missing RESEND_API_KEY" }, 500);
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL, // e.g., "DAIKAI Quiz <hcwong@daikai.com>"
        to,
        subject,
        html: html || fallbackHtml,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Resend API error", r.status, data);
      return cors({ ok: false, error: "Resend error", details: data }, 500);
    }

    return cors({ ok: true, id: data?.id || null, provider: "resend" });
  } catch (e) {
    console.error("send-results crashed:", e);
    return cors({ ok: false, error: String(e) }, 500);
  }
});
