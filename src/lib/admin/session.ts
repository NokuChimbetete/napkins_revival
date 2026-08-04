import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The one place that answers "is this request an editor?".
 *
 * Every admin page, every Server Action and every admin route handler goes
 * through here, close to the data rather than at the layout — a layout does not
 * re-render on client navigation, and a Server Action can be invoked directly
 * without rendering any page at all.
 *
 * The check is `rpc("is_admin")`, deliberately: that is the *same* function the
 * RLS policies on `issues`, `pieces` and `storage.objects` call. Reimplementing
 * the whitelist lookup here would create a second definition of "admin" that
 * could drift out of step with the one Postgres actually enforces.
 */

export type AdminUser = { id: string; email: string };

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  try {
    const supabase = await createClient();

    // getUser() verifies the JWT with Supabase. getSession() would just read
    // the cookie, which is attacker-writable.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data, error } = await supabase.rpc("is_admin");
    if (error || data !== true) return null;

    return { id: user.id, email: user.email };
  } catch {
    // A misconfigured or unreachable database means "not an admin". Failing
    // closed is the only safe direction here.
    return null;
  }
});

/** Use at the top of every admin page and action. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For Server Actions, which should report a failure rather than redirect
 *  mid-mutation — a redirect thrown from an action the editor triggered by
 *  pressing "Save" loses whatever they had typed. */
export async function assertAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) throw new Error("Your session has expired. Sign in again to save.");
  return user;
}
