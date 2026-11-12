import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, Calculator, Crown, Medal, PlayCircle, Trophy, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { yearLabel } from "@/lib/phone";
import { GoldFlakes } from "@/components/mavia/gold-flakes";
import { YearChips } from "@/components/mavia/year-chips";
import { EmptyState } from "@/components/mavia/page-header";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — ماڤيا" },
      { name: "description", content: "لوحة تصدر الدفعة وتعريف بمنصة ماڤيا." },
      { property: "og:title", content: "الرئيسية — ماڤيا" },
      { property: "og:description", content: "لوحة تصدر الدفعة على ماڤيا." },
    ],
  }),
  component: HomePage,
});

const QUICK = [
  {
    to: "/courses",
    label: ["الكورسات", "Courses"],
    text: ["مواد دفعتك وملخصاتها واختباراتها", "Your cohort's subjects, summaries and quizzes"],
    icon: BookOpen,
  },
  {
    to: "/learning",
    label: ["Learning", "Learning"],
    text: ["فيديوهات ومنصات GIS وبرمجة", "GIS and programming videos and platforms"],
    icon: PlayCircle,
  },
  {
    to: "/gpa",
    label: ["حاسبة GPA", "GPA calculator"],
    text: ["احسب معدلك من درجاتك", "Work out your GPA from your marks"],
    icon: Calculator,
  },
  {
    to: "/community",
    label: ["Community", "Community"],
    text: ["جروبات وشات الدفعة ومساعد ذكي", "Groups, cohort chat and an AI assistant"],
    icon: Users,
  },
] as const;

function HomePage() {
  const { data: me } = useMe();
  const { tr, lang } = useLang();
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    if (me && year === null) setYear(me.academicYear);
  }, [me, year]);

  const board = useQuery({
    queryKey: ["leaderboard", year],
    enabled: year !== null,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { _year: year! });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = board.data ?? [];
  const myRank = rows.findIndex((r) => r.user_id === me?.id);

  return (
    <div className="space-y-10">
      <section className="card-lux animate-rise relative overflow-hidden p-7 sm:p-10">
        <GoldFlakes count={6} />
        <div className="relative max-w-2xl">
          <p className="text-sm text-primary">
            {tr("أهلًا", "Hi")} {me?.fullName ?? ""} 👋
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {tr("مرحبًا بيك في", "Welcome to")}{" "}
            <span className="animate-sheen font-latin tracking-wider">MAVIA</span>
          </h1>
          <p className="mt-4 leading-relaxed text-foreground/80">
            {tr(
              "ماڤيا منصة معمولة خصيصًا لجميع الدفعات من الأولى للرابعة، بتضم جميع مواد كل دفعة على حدى بالملخصات والاختبارات الشاملة، وكورسات تعليمية مفيدة للـ GIS والبرمجة بشكل عام.",
              "MAVIA is built for every cohort from Year 1 to Year 4. It holds each year's subjects with summaries and full quizzes, plus useful courses in GIS and programming.",
            )}
          </p>
          {me && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-1.5 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              {myRank >= 0 && year === me.academicYear
                ? `${tr("ترتيبك في", "Your rank in")} ${yearLabel(me.academicYear, lang)}: #${myRank + 1}`
                : `${tr("دفعتك", "Your cohort")}: ${yearLabel(me.academicYear, lang)}`}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="card-lux press-gold group block p-5">
            <q.icon className="h-6 w-6 text-primary group-active:text-primary-foreground" />
            <div className="mt-3 font-display text-lg font-semibold">
              {tr(q.label[0], q.label[1])}
            </div>
            <div className="text-sm text-muted-foreground group-active:text-primary-foreground">
              {tr(q.text[0], q.text[1])}
            </div>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              <span className="text-gold-gradient">{tr("لوحة التصدر", "Leaderboard")}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {tr(
                "النقاط = مجموع أعلى درجة في كل اختبار حليته على المنصة.",
                "Points = the sum of your best score in every quiz you took.",
              )}
            </p>
          </div>
          {me?.isAdmin ? (
            <YearChips value={year} onChange={(v) => setYear(v)} />
          ) : (
            <span className="rounded-full border border-primary/40 px-4 py-1.5 text-sm text-primary">
              {yearLabel(me?.academicYear, lang)}
            </span>
          )}
        </div>

        {board.isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        ) : rows.length === 0 ? (
          <EmptyState
            title={tr("لسه مفيش طلاب في الدفعة دي", "No students in this cohort yet")}
            hint={tr(
              "أول ما الطلاب يحلوا اختبارات هيظهروا هنا.",
              "Students appear here once they take quizzes.",
            )}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 items-end gap-3">
              {[1, 0, 2].map((idx) => {
                const r = rows[idx];
                if (!r) return <div key={idx} />;
                const first = idx === 0;
                return (
                  <div
                    key={r.user_id}
                    className={cn(
                      "card-lux flex flex-col items-center p-4 text-center",
                      first && "border-primary/60 pb-8 shadow-gold",
                    )}
                  >
                    {first ? (
                      <Crown className="h-8 w-8 animate-float text-primary" />
                    ) : (
                      <Medal className="h-6 w-6 text-gold-deep" />
                    )}
                    <div className="mt-2 font-latin text-2xl font-bold text-gold-gradient">
                      #{idx + 1}
                    </div>
                    <div className="mt-1 line-clamp-1 text-sm font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.points} {tr("نقطة", "pts")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              {rows.map((r, i) => (
                <div
                  key={r.user_id}
                  className={cn(
                    "flex items-center gap-4 border-b border-border px-5 py-3 last:border-0",
                    r.user_id === me?.id ? "bg-accent" : "bg-card/60",
                  )}
                >
                  <div className="w-8 font-latin text-lg font-bold text-primary">{i + 1}</div>
                  <div className="flex-1 font-medium">
                    {r.full_name}
                    {r.user_id === me?.id && (
                      <span className="ms-2 text-xs text-primary">({tr("إنت", "you")})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.quizzes_taken} {tr("اختبار", "quizzes")}
                  </div>
                  <div className="w-20 text-end font-semibold">
                    {r.points} {tr("نقطة", "pts")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
