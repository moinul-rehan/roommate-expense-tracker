import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const mode = searchParams.get("mode") === "create_cottage" ? "create_cottage" : "login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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

            await supabase.rpc("create_cottage_for_current_user", {
              p_cottage_name: cottageName,
              p_first_name: firstName,
              p_last_name: lastName,
            });

            cookieStore.delete("pending_cottage_name");
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
