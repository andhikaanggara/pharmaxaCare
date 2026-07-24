import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/attendance"); //harusnya halaman dashboart
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <LoginClient />
    </div>
  );
}
