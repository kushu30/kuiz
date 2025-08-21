// Sends queued score emails that are due
export const handler = async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE;
  const resendKey = process.env.RESEND_API_KEY;

  if (!url || !service || !resendKey) {
    return { statusCode: 500, body: "Missing env (SUPABASE or RESEND_API_KEY)" };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, service);

  // due rows (not sent)
  const { data: rows, error } = await sb
    .from("score_emails")
    .select("id,email,subject,html")
    .lte("send_after", new Date().toISOString())
    .is("sent_at", null)
    .limit(50);

  if (error) return { statusCode: 500, body: error.message };
  if (!rows?.length) return { statusCode: 200, body: "No emails due" };

  for (const r of rows) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: "Kuiz <no-reply@kuiz.app>",
          to: [r.email],
          subject: r.subject,
          html: r.html
        })
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("Resend failed:", t);
        continue;
      }
      await sb.from("score_emails").update({ sent_at: new Date().toISOString() }).eq("id", r.id);
    } catch (e) {
      console.error("Send error:", e);
    }
  }

  return { statusCode: 200, body: "Processed" };
};
