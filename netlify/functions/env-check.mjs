export const handler = async () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const ref = url ? new URL(url).host.split(".")[0] : null;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supabaseUrl: url, projectRef: ref }),
  };
};
