import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calculator, Home, LogOut, PlayCircle, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { yearLabel } from "@/lib/phone";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/courses", label: "الكورسات", icon: BookOpen },
  { to: "/learning", label: "Learning", icon: PlayCircle },
  { to: "/gpa", label: "حاسبة GPA", icon: Calculator },
  { to: "/community", label: "الكوميونتي", icon: Users },
] as const;

const navItem =
  "press-gold flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/75 hover:text-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-gold-sm";

const mobileItem =
  "press-gold flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-foreground/70 data-[status=active]:bg-primary data-[status=active]:text-primary-foreground";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-ink-gradient">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/home" aria-label="ماڤيا">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={navItem}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {me && (
              <div className="hidden text-left sm:block" dir="rtl">
                <div className="text-sm font-semibold">{me.fullName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {yearLabel(me.academicYear)}
                  {me.isAdmin && <span className="mr-1 text-primary">• أدمن</span>}
                </div>
              </div>
            )}
            <Button variant="outline" size="icon-sm" onClick={signOut} aria-label="تسجيل الخروج">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 lg:pb-16">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex gap-1 rounded-2xl border border-border bg-background/90 p-1.5 shadow-card backdrop-blur-xl lg:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={mobileItem}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
