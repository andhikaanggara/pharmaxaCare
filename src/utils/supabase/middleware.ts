import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // 9 Hour Session Expiration Check
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const loginTime = new Date(session.user.last_sign_in_at!).getTime();
    const currentTime = new Date().getTime();
    const LIMIT_9_HOURS = 9 * 60 * 60 * 1000;

    if (currentTime - loginTime > LIMIT_9_HOURS) {
      const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(
        request.method,
      );

      if (!isMutating) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "session_expired");
        return NextResponse.redirect(url);
      }
    }
  }

  await supabase.auth.getUser();
  return supabaseResponse;
}
