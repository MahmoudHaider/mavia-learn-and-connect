import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import hero from "@/assets/hero-contours.jpg";
import { Brand } from "@/components/mavia/brand";
import { GoldFlakes } from "@/components/mavia/gold-flakes";
import { YearChips } from "@/components/mavia/year-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, normalizePhone, phoneToEmail } from "@/lib/phone";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/mavia/language-toggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — ماڤيا MAVIA" },
      { name: "description", content: "سجّل حسابك في ماڤيا برقم تليفونك وسنتك الدراسية." },
      { property: "og:title", content: "تسجيل الدخول — ماڤيا" },
      { property: "og:description", content: "انضم لمنصة ماڤيا لكل الدفعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function authError(message: string, tr: (ar: string, en: string) => string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login"))
    return tr("رقم التليفون أو الباسورد غلط.", "Wrong phone number or password.");
  if (m.includes("already registered") || m.includes("already exists"))
    return tr(
      "الرقم ده متسجل قبل كده، جرّب تسجّل دخول.",
      "This number is already registered. Try signing in.",
    );
  if (m.includes("pwned") || m.includes("weak") || m.includes("known"))
    return tr(
      "الباسورد ده ضعيف أو معروف، اختار باسورد أقوى.",
      "This password is too weak or common. Pick a stronger one.",
    );
  if (m.includes("at least"))
    return tr("الباسورد لازم يكون 6 حروف على الأقل.", "Password must be at least 6 characters.");
  return tr("حصلت مشكلة، حاول تاني.", "Something went wrong, try again.");
}

function AuthPage() {
  const navigate = useNavigate();
  const { tr } = useLang();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [year, setYear] = useState<number | null>(1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error(tr("اكتب رقم تليفون صحيح.", "Enter a valid phone number."));
      return;
    }
    if (password.length < 6) {
      toast.error(
        tr("الباسورد لازم يكون 6 حروف على الأقل.", "Password must be at least 6 characters."),
      );
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        if (name.trim().length < 2) {
          toast.error(tr("اكتب اسمك.", "Enter your name."));
          return;
        }
        if (!year) {
          toast.error(tr("اختار سنتك الدراسية.", "Choose your academic year."));
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: phoneToEmail(phone),
          password,
          options: {
            data: { full_name: name.trim(), phone: normalizePhone(phone), academic_year: year },
          },
        });
        if (error) {
          toast.error(authError(error.message, tr));
          return;
        }
        if (!data.session) {
          toast.error(tr("الحساب اتعمل، سجّل دخول دلوقتي.", "Account created, please sign in."));
          return;
        }
        toast.success(tr("أهلًا بيك في ماڤيا!", "Welcome to MAVIA!"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: phoneToEmail(phone),
          password,
        });
        if (error) {
          toast.error(authError(error.message, tr));
          return;
        }
      }
      navigate({ to: "/home", replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <img
        src={hero}
        alt=""
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <GoldFlakes count={8} />
      <div className="card-lux animate-rise relative w-full max-w-md p-7 backdrop-blur-xl sm:p-9">
        <LanguageToggle className="absolute top-4 end-4" />
        <div className="mb-6 flex justify-center">
          <Brand size="lg" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/60 p-1">
          {(["register", "login"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant="chip"
              data-active={mode === m}
              className="rounded-lg border-0"
              onClick={() => setMode(m)}
            >
              {m === "register" ? tr("حساب جديد", "Create account") : tr("تسجيل الدخول", "Sign in")}
            </Button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">{tr("الاسم", "Name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr("اسمك بالكامل", "Your full name")}
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">{tr("رقم التليفون", "Phone number")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className="text-start"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{tr("الباسورد", "Password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              dir="ltr"
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label>{tr("السنة الدراسية", "Academic year")}</Label>
              <YearChips value={year} onChange={setYear} />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "register" ? tr("إنشاء الحساب", "Create account") : tr("دخول", "Sign in")}
          </Button>
        </form>
      </div>
    </div>
  );
}
