/**
 * Is Supabase actually wired up, or are we still on the placeholder env?
 *
 * Every data function falls back to the JSON fixtures when this is false, so
 * the site works offline and before the project was provisioned.
 */
export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project-ref") &&
      !key.startsWith("your-") &&
      !key.startsWith("PASTE")
  );
}
