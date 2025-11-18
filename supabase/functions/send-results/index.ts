// functions/send-results/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ---- Provider config (set via Supabase secrets) ----
const MAIL_PROVIDER   = (Deno.env.get("MAIL_PROVIDER") || "sendgrid").toLowerCase(); // "sendgrid" | "resend"
const RESEND_API_KEY  = (Deno.env.get("RESEND_API_KEY") || "");
const SENDGRID_API_KEY= (Deno.env.get("SENDGRID_API_KEY") || "");
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL") || "DAIKAI Quiz <hc_wong@daikai.com>";

// 🆕 Base URL of your app, used to build the results link
// e.g. APP_BASE_URL="https://engine-quiz.vercel.app"
const APP_BASE_URL    = Deno.env.get("APP_BASE_URL") || "https://example.com";

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
    // 🆕 added resultId & quiz_name
    const {
      to,
      score,
      total,
      percentage,
      reviewUrl, // optional manual override
      html,
      resultId,   // quiz_results.id from frontend
      quiz_name,  // for nicer subject
    } = await req.json();

    if (!to) return cors({ ok: false, error: "`to` is required" }, 400);
    if (typeof score !== "number" || typeof total !== "number") {
      return cors(
        { ok: false, error: "`score` and `total` must be numbers" },
        400
      );
    }
    console.log("send-results provider:", MAIL_PROVIDER, "from:", FROM_EMAIL);

    const pct = percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);

    // Build the final review URL, same logic as before
const finalReviewUrl =
  reviewUrl ||
  (resultId
    ? `${APP_BASE_URL}/results?result_id=${encodeURIComponent(resultId)}&shared=1`
    : "");


const subject =
  quiz_name && `${quiz_name}`.trim().length
    ? `Your ${quiz_name} quiz results`
    : "Your DAIKAI Quiz Results";

// 🆕 Build button + fallback link only if we have a URL
const buttonBlock = finalReviewUrl
  ? `
    <tr>
      <td align="center" style="padding: 24px 24px 8px 24px;">
        <a
          href="${finalReviewUrl}"
          style="
            display:inline-block;
            padding: 12px 28px;
            border-radius: 999px;
            background-color:#2563eb;
            color:#ffffff;
            font-weight:600;
            font-size:14px;
            text-decoration:none;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          "
        >
          View full results
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px 24px 24px; color:#6b7280; font-size:12px; line-height:1.5;">
        If the button doesn’t work, copy and paste this URL into your browser:<br />
        <a href="${finalReviewUrl}" style="color:#2563eb; word-break:break-all;">${finalReviewUrl}</a>
      </td>
    </tr>
  `
  : "";

// 🆕 Corporate-style HTML email
const fallbackHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:0; background-color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f172a; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#f9fafb; border-radius:18px; overflow:hidden; box-shadow:0 18px 45px rgba(15,23,42,0.45);">
            <tr>
              <td style="padding:24px 24px 8px 24px; text-align:center; background:linear-gradient(135deg,#0f172a,#1e293b);">
                <!-- DAIKAI badge -->
                <div
                  style="
                    display:inline-block;
                    padding:8px 24px;
                    border-radius:8px;
                    background-color:#16a34a;
                    color:#ffffff;
                    font-size:20px;
                    font-weight:700;
                    letter-spacing:0.2em;
                    text-transform:uppercase;
                    box-shadow:0 8px 20px rgba(22,163,74,0.5);
                    margin-bottom:16px;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  "
                >
                  DAIKAI
                </div>
                <div style="color:#e5e7eb; font-size:18px; font-weight:600; margin-bottom:4px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  ${subject}
                </div>
                <div style="color:#9ca3af; font-size:13px; margin-bottom:8px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  Here is a summary of your recent attempt.
                </div>
              </td>
            </tr>

            <!-- Score card -->
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate; border-radius:16px; background-color:#ffffff; border:1px solid #e5e7eb; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                  <tr>
                    <td style="padding:16px 18px 10px 18px; font-size:15px; font-weight:600; color:#111827;">
                      Score summary
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 18px 16px 18px; font-size:14px; color:#4b5563;">
                      <div style="margin-bottom:4px;">
                        <strong>Score:</strong> ${score} / ${total}
                      </div>
                      <div style="margin-bottom:4px;">
                        <strong>Percentage:</strong> ${pct}%
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${buttonBlock}

            <!-- Footer -->
            <tr>
              <td style="padding:0 24px 24px 24px; color:#9ca3af; font-size:11px; line-height:1.5; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                You’re receiving this email because a quiz attempt was completed using this address.
                If this wasn’t you, you can safely ignore this message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
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

      return cors({
        ok: true,
        provider: "sendgrid",
        reviewUrl: finalReviewUrl || null,
      });
    }

    // Default: Resend
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
        from: FROM_EMAIL,
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

    return cors({
      ok: true,
      id: data?.id || null,
      provider: "resend",
      reviewUrl: finalReviewUrl || null,
    });
  } catch (e) {
    console.error("send-results crashed:", e);
    return cors({ ok: false, error: String(e) }, 500);
  }
});
