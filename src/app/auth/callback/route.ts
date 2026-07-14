import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawMode = searchParams.get("mode");
  const mode = rawMode === "create_cottage" ? "create_cottage" : rawMode === "recovery" ? "recovery" : "login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password recovery: the code exchange above is the whole point (it's
      // what actually persists the session cookie — a Server Component
      // can't set cookies, so exchanging the code inside /reset-password's
      // page itself would silently fail to keep the session past that
      // first render). No profile/cottage logic applies here.
      if (mode === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          if (mode === "create_cottage") {
            const cookieStore = await cookies();
            const cottageName = cookieStore.get("pending_cottage_name")?.value
              ? decodeURIComponent(cookieStore.get("pending_cottage_name")!.value)
              : "My Cottage";
            const metadata = user.user_metadata ?? {};
            const firstName =
              metadata.given_name ?? (metadata.full_name as string | undefined)?.split(" ")[0] ?? null;
            const lastName = metadata.family_name ?? null;

            const { error: createError } = await supabase.rpc("create_cottage_for_current_user", {
              p_cottage_name: cottageName,
              p_first_name: firstName,
              p_last_name: lastName,
            });

            cookieStore.delete("pending_cottage_name");

            if (createError) {
              console.error("create_cottage_for_current_user failed:", createError);
              await supabase.auth.signOut();
              const detail = encodeURIComponent(createError.message);
              return NextResponse.redirect(`${origin}/signup?error=create_failed&detail=${detail}`);
            }
          } else {
            // "Sign in as member" via Google, but no cottage membership exists.
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/login?error=no_account`);
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
