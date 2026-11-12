import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label={lang === "ar" ? "Switch to English" : "التحويل للعربي"}
    >
      <Languages />
      {lang === "ar" ? "English" : "عربي"}
    </Button>
  );
}
