import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const password = Deno.env.get("ANALYTICS_RW_PASSWORD");
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!password) throw new Error("ANALYTICS_RW_PASSWORD not set");
    if (!dbUrl) throw new Error("SUPABASE_DB_URL not set");

    // Simple sanity check — disallow single quote to keep things safe even though we use parameter binding via format
    if (password.includes("'")) {
      throw new Error("Password must not contain single quote characters");
    }

    const client = new Client(dbUrl);
    await client.connect();
    try {
      // ALTER ROLE does not support parameter binding, so we inject the literal via quote_literal
      await client.queryArray(
        `DO $$ BEGIN
           EXECUTE format('ALTER ROLE analytics_rw WITH LOGIN PASSWORD %L', $1);
         END $$;`,
        [password],
      );
    } finally {
      await client.end();
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "analytics_rw password set and LOGIN enabled",
        username_pooler: "analytics_rw.vjvhaegbfjepysptcygz",
        username_direct: "analytics_rw",
        host_pooler: "aws-1-eu-west-1.pooler.supabase.com",
        port_pooler: 6543,
        host_direct: "db.vjvhaegbfjepysptcygz.supabase.co",
        port_direct: 5432,
        database: "postgres",
        ssl: "require",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});