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

function arabicAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "رقم التليفون أو الباسورد غلط.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "الرقم ده متسجل قبل كده، جرّب تسجّل دخول.";
  if (m.includes("pwned") || m.includes("weak") || m.includes("known"))
    return "الباسورد ده ضعيف أو معروف، اختار باسورد أقوى.";
  if (m.includes("at least")) return "الباسورد لازم يكون 6 حروف على الأقل.";
  return "حصلت مشكلة، حاول تاني.";
}

function AuthPage() {
  const navigate = useNavigate();
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
    if (!isValidPhone(phone)) { toast.error("اكتب رقم تليفون صحيح."); return; }
    if (password.length < 6) { toast.error("الباسورد لازم يكون 6 حروف على الأقل."); return; }
    setBusy(true);
    try {
      if (mode === "register") {
        if (name.trim().length < 2) { toast.error("اكتب اسمك."); return; }
        if (!year) { toast.error("اختار سنتك الدراسية."); return; }
        const { data, error } = await supabase.auth.signUp({
          email: phoneToEmail(phone),
          password,
          options: {
            data: { full_name: name.trim(), phone: normalizePhone(phone), academic_year: year },
          },
        });
        if (error) { toast.error(arabicAuthError(error.message)); return; }
        if (!data.session) { toast.error("الحساب اتعمل، سجّل دخول دلوقتي."); return; }
        toast.success("أهلًا بيك في ماڤيا!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: phoneToEmail(phone),
          password,
        });
        if (error) { toast.error(arabicAuthError(error.message)); return; }
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
              {m === "register" ? "حساب جديد" : "تسجيل الدخول"}
            </Button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك بالكامل"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم التليفون</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">الباسورد</Label>
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
              <Label>السنة الدراسية</Label>
              <YearChips value={year} onChange={setYear} />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "register" ? "إنشاء الحساب" : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
