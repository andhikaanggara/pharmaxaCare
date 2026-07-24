import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

//  Libs & Utils
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

// Providers & Global Components
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { SessionWatcher } from "@/lib/providers/session-watcher";
import { ThemeProvider } from "@/lib/providers/theme-provider";

// Fonts Configuration
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata Configuration
export const metadata: Metadata = {
  title: "Pharmaxa Care",
  description: "Clinic management application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={400}>
            <LayoutWrapper>{children}</LayoutWrapper>
            <SessionWatcher lastSignInAt={user?.email_change_sent_at} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
