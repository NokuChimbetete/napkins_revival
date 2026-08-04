import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the magic link lands.
 *
 * The second gate. `requestMagicLink` already refuses to email anyone who is
 * not on the whitelist, but this checks again from the other side, because a
 * link is a bearer token: if someone is removed from `admin_whitelist` after
 * their link is sent, or a link is forwarded, the session that comes back here
 * still has to be re-examined against the list as it stands *now*.
 *
 * A session that fails is signed out immediately rather than merely being
 * denied at the UI — leaving a live non-editor session lying around is how a
 * later bug becomes an access-control bug.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  // Google can send the editor back without a code at all — they closed the
  // account chooser, or declined. That is a normal thing to do, not a failure
  // worth an alarming message.
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return to(
      `/admin/login?error=${oauthError === "access_denied" ? "cancelled" : "provider"}`
    );
  }

  if (!code) return to("/admin/login?error=expired");

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return to("/admin/login?error=expired");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return to("/admin/login?error=not_admin");
  }

  return to(
    next && /^\/admin(?:\/|$)/.test(next) && !next.startsWith("/admin/login") ? next : "/admin"
  );
}
