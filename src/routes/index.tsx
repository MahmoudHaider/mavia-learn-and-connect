import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpenCheck, FileText, Globe2, GraduationCap, Code2, Users } from "lucide-react";

import hero from "@/assets/hero-contours.jpg";
import { Brand, BrandMark } from "@/components/mavia/brand";
import { GoldFlakes } from "@/components/mavia/gold-flakes";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: GraduationCap, title: "من الأولى للرابعة", text: "كل دفعة ليها موادها لوحدها ومنظمة." },
  { icon: FileText, title: "ملخصات", text: "ملخصات مركزة لكل مادة تذاكر منها بسرعة." },
  { icon: BookOpenCheck, title: "اختبارات شاملة", text: "اختبر نفسك وشوف ترتيبك في لوحة التصدر." },
  { icon: Globe2, title: "كورسات GIS", text: "كورسات تعليمية مفيدة في نظم المعلومات الجغرافية." },
  { icon: Code2, title: "برمجة", text: "روابط ومصادر لتعلم البرمجة بشكل عام." },
  { icon: Users, title: "مجتمع الدفعة", text: "جروبات وشات داخل المنصة ومساعد ذكي." },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
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
      <div className="absolute inset-0 bg-gradient-to-l from-background via-background/70 to-background/10" />
      <GoldFlakes />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5">
        <header className="flex h-20 items-center justify-between">
          <Brand />
          <Button asChild variant="outline" size="sm">
            <Link to={signedIn ? "/home" : "/auth"}>{signedIn ? "ادخل المنصة" : "تسجيل الدخول"}</Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl">
            <div className="animate-rise mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/50 px-4 py-1.5 text-xs text-primary backdrop-blur">
              منصة لكل الدفعات • الأولى ← الرابعة
            </div>
            <h1 className="animate-rise text-5xl leading-tight font-bold sm:text-7xl">
              <span className="text-foreground">ذاكر بذكاء مع</span>
              <br />
              <span className="animate-sheen font-latin tracking-wider">MAVIA</span>
            </h1>
            <p className="animate-rise mt-6 text-lg leading-relaxed text-foreground/80 [animation-delay:120ms]">
              ماڤيا منصة معمولة خصيصًا لجميع الدفعات من الأولى للرابعة، بتضم جميع مواد كل دفعة على
              حدى بالملخصات والاختبارات الشاملة، وكورسات تعليمية مفيدة في الـ GIS والبرمجة بشكل عام.
            </p>
            <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:220ms]">
              <Button asChild size="lg">
                <Link to={signedIn ? "/home" : "/auth"}>{signedIn ? "ادخل المنصة" : "ابدأ دلوقتي"}</Link>
              </Button>
              {!signedIn && (
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">عندي حساب</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-64 sm:w-80 lg:w-96">
            <div className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl" />
            <BrandMark className="animate-float relative h-auto w-full ring-2 shadow-gold" />
            <p className="relative mt-6 text-center font-latin text-xs tracking-[0.35em] text-primary uppercase" dir="ltr">
              Same ground · Different perspective
            </p>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card-lux animate-rise p-5 backdrop-blur"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
