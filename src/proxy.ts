/**
 * Session refresh, and a first (not last) look at who is asking.
 *
 * In Next 16 this file is `proxy.ts`, not `middleware.ts` — the convention was
 * renamed and the named export must be `proxy`. It runs on the Node runtime;
 * `edge` is not supported here.
 *
 * Two jobs, in this order of importance:
 *
 *  1. Refresh the Supabase session cookie. Server Components cannot write
 *     cookies, so without this an editor's session silently expires mid-issue
 *     and their next save fails with a permission error they cannot act on.
 *
 *  2. Bounce signed-out visitors away from /admin. This is a courtesy, NOT the
 *     security boundary — CVE-class proxy bypasses exist (one was patched in
 *     the 16.2.12 bump this project just took), and a proxy cannot see a
 *     Server Action invoked directly. The real gates are `requireAdmin()` in
 *     every admin page and action, and RLS in Postgres. Both are checked
 *     independently of anything decided here.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), not getSession(): this revalidates the token with Supabase
  // rather than trusting whatever is in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin") && !path.startsWith("/admin/login") && !user) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    // so the editor lands back where they were going after signing in
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  // Everything except static assets and the image optimizer. The session
  // refresh has to run broadly — an editor who spends an hour reading the
  // published site should still be signed in when they open /admin.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|woff2?|ttf|mp4|pdf)$).*)"],
};
