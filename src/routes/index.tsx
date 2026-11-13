import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpenCheck, FileText, Globe2, GraduationCap, Code2, Users } from "lucide-react";

import hero from "@/assets/hero-contours.jpg";
import { Brand, BrandMark } from "@/components/mavia/brand";
import { GoldFlakes } from "@/components/mavia/gold-flakes";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/mavia/language-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ماڤيا MAVIA — منصة الدفعات من الأولى للرابعة" },
      {
        name: "description",
        content:
          "ماڤيا منصة معمولة خصيصًا لكل الدفعات من الأولى للرابعة: مواد كل دفعة بالملخصات والاختبارات الشاملة وكورسات GIS والبرمجة.",
      },
      { property: "og:title", content: "ماڤيا MAVIA — منصة الدفعات" },
      {
        property: "og:description",
        content: "ملخصات واختبارات شاملة وكورسات GIS وبرمجة ومجتمع لكل دفعة.",
      },
      { name: "author", content: "Mahmoud Haider Youseif" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES: { icon: typeof Users; title: [string, string]; text: [string, string] }[] = [
  {
    icon: GraduationCap,
    title: ["من الأولى للرابعة", "Year 1 to Year 4"],
    text: ["كل دفعة ليها موادها لوحدها ومنظمة.", "Every cohort gets its own organised subjects."],
  },
  {
    icon: FileText,
    title: ["ملخصات", "Summaries"],
    text: ["ملخصات مركزة لكل مادة تذاكر منها بسرعة.", "Focused summaries for every subject."],
  },
  {
    icon: BookOpenCheck,
    title: ["اختبارات شاملة", "Full quizzes"],
    text: ["اختبر نفسك وشوف ترتيبك في لوحة التصدر.", "Test yourself and climb the leaderboard."],
  },
  {
    icon: Globe2,
    title: ["كورسات GIS", "GIS courses"],
    text: [
      "كورسات تعليمية مفيدة في نظم المعلومات الجغرافية.",
      "Useful courses in geographic information systems.",
    ],
  },
  {
    icon: Code2,
    title: ["برمجة", "Programming"],
    text: ["روابط ومصادر لتعلم البرمجة بشكل عام.", "Links and resources to learn programming."],
  },
  {
    icon: Users,
    title: ["مجتمع الدفعة", "Cohort community"],
    text: ["جروبات وشات داخل المنصة ومساعد ذكي.", "Groups, in-app chat and an AI assistant."],
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  const { tr } = useLang();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={hero}
        alt=""
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-l ltr:bg-gradient-to-r from-background via-background/70 to-background/10" />
      <GoldFlakes />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5">
        <header className="flex h-20 items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="outline" size="sm">
              <Link to={signedIn ? "/home" : "/auth"}>
                {signedIn ? tr("ادخل المنصة", "Open platform") : tr("تسجيل الدخول", "Sign in")}
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl">
            <div className="animate-rise mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/50 px-4 py-1.5 text-xs text-primary backdrop-blur">
              {tr(
                "منصة لكل الدفعات • الأولى ← الرابعة",
                "One platform for every cohort • Year 1 → 4",
              )}
            </div>
            <h1 className="animate-rise text-5xl leading-tight font-bold sm:text-7xl">
              <span className="text-foreground">{tr("ذاكر بذكاء مع", "Study smarter with")}</span>
              <br />
              <span className="animate-sheen font-latin tracking-wider">MAVIA</span>
            </h1>
            <p className="animate-rise mt-6 text-lg leading-relaxed text-foreground/80 [animation-delay:120ms]">
              {tr(
                "ماڤيا منصة معمولة خصيصًا لجميع الدفعات من الأولى للرابعة، بتضم جميع مواد كل دفعة على حدى بالملخصات والاختبارات الشاملة، وكورسات تعليمية مفيدة في الـ GIS والبرمجة بشكل عام.",
                "MAVIA is built for every cohort from Year 1 to Year 4. It holds each year's subjects with summaries and full quizzes, plus useful courses in GIS and programming.",
              )}
            </p>
            <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:220ms]">
              <Button asChild size="lg">
                <Link to={signedIn ? "/home" : "/auth"}>
                  {signedIn ? tr("ادخل المنصة", "Open platform") : tr("ابدأ دلوقتي", "Get started")}
                </Link>
              </Button>
              {!signedIn && (
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">{tr("عندي حساب", "I have an account")}</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-64 sm:w-80 lg:w-96">
            <div className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl" />
            <BrandMark className="animate-float relative h-auto w-full ring-2 shadow-gold" />
            <p
              className="relative mt-6 text-center font-latin text-xs tracking-[0.35em] text-primary uppercase"
              dir="ltr"
            >
              Same ground · Different perspective
            </p>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title[1]}
              className="card-lux animate-rise p-5 backdrop-blur"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{tr(f.title[0], f.title[1])}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tr(f.text[0], f.text[1])}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-border/60 py-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">
              {tr(
                "© 2026 ماڤيا MAVIA — جميع الحقوق محفوظة",
                "© 2026 MAVIA — All rights reserved",
              )}
            </p>
            <p className="text-xs text-primary/80">
              {tr("صنعها", "Created by")} <span className="font-semibold">Mahmoud Haider Youseif</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
