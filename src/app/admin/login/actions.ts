"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string };

/**
 * Sign in with Google. The only way in.
 *
 * The whitelist cannot be checked before we start — Google is the one who knows
 * which address is about to be used. So the gate sits at /auth/callback, which
 * re-checks `is_admin()` the moment a session exists and signs out anything
 * that isn't an editor. Access fails closed either way; the only trace a
 * stranger leaves is a Supabase auth row with no permissions attached to it.
 *
 * `prompt=select_account` is deliberate. Without it Google silently reuses
 * whichever account the browser is already signed into, which on a shared or
 * personal laptop is very often a personal Gmail — and the editor is then told
 * they aren't on the list, with no clue why.
 */
export async function signInWithGoogle(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const next = String(formData.get("next") ?? "/admin");
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await siteOrigin());

  // Ask Supabase whether Google is actually switched on, BEFORE sending anyone
  // there. signInWithOAuth() only builds a URL — it never contacts Supabase, so
  // a disabled provider isn't discovered until the browser has already left our
  // site and lands on a raw JSON error on supabase.co with no way back. One
  // cheap request buys a real message instead.
  if (!(await googleIsEnabled())) {
    return {
      error:
        "Google sign-in isn’t switched on for this project. Turn it back on under Authentication → Providers in the Supabase dashboard — most often it’s an OAuth client secret that has expired.",
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    return { error: error?.message ?? "Couldn’t start Google sign-in. Try again." };
  }

  // Throws its own control-flow signal — nothing after this runs.
  redirect(data.url);
}

/** Supabase publishes which providers are enabled at /auth/v1/settings. On any
 *  doubt — network blip, unexpected shape — this says "no", which produces a
 *  message naming the fix rather than a silent bounce to an error page. */
async function googleIsEnabled(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

/** The deployed origin, taken from the request rather than hard-coded, so this
 *  works on localhost, on a preview URL and in production without config. */
async function siteOrigin(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
