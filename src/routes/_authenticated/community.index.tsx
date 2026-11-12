import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ExternalLink, MessagesSquare, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { ACADEMIC_YEARS, yearLabel } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/mavia/page-header";
import { YearChips } from "@/components/mavia/year-chips";
import { AdminDialog, Field, required, selectClass, str } from "@/components/mavia/admin-dialog";
import { BrandMark } from "@/components/mavia/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/community/")({
  head: () => ({
    meta: [
      { title: "الكوميونتي — ماڤيا" },
      { name: "description", content: "جروبات الدفعة وشات المنصة ومساعد ماڤيا الذكي." },
      { property: "og:title", content: "الكوميونتي — ماڤيا" },
      { property: "og:description", content: "مجتمع كل دفعة على ماڤيا." },
    ],
  }),
  component: CommunityPage,
});

const PLATFORMS: Record<string, [string, string]> = {
  whatsapp: ["واتساب", "WhatsApp"],
  telegram: ["تليجرام", "Telegram"],
  facebook: ["فيسبوك", "Facebook"],
  discord: ["ديسكورد", "Discord"],
  other: ["رابط", "Link"],
};

function CommunityPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { tr, lang } = useLang();
  const [year, setYear] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (me && !touched) setYear(me.academicYear);
  }, [me, touched]);

  const links = useQuery({
    queryKey: ["community-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_links")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const shown = (links.data ?? []).filter(
    (l) => year === null || l.academic_year === null || l.academic_year === year,
  );

  async function add(form: FormData) {
    const url = required(form, "url", tr("الرابط", "Link"));
    const y = str(form, "year");
    const { error } = await supabase.from("community_links").insert({
      title: required(form, "title", tr("الاسم", "Name")),
      url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
      platform: str(form, "platform") || "whatsapp",
      academic_year: y ? Number(y) : null,
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["community-links"] });
  }
  async function remove(id: string) {
    if (!confirm(tr("تمسح الجروب ده؟", "Delete this group?"))) return;
    await supabase.from("community_links").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["community-links"] });
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Community"
        title="Community"
        description={tr(
          "اتواصل مع دفعتك، وادخل الجروبات، واسأل مساعد ماڤيا.",
          "Talk to your cohort, join the groups and ask the MAVIA assistant.",
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/community/chat"
          className="card-lux press-gold group flex items-center gap-4 p-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-primary-foreground">
            <MessagesSquare className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-semibold">
              {tr("شات الدفعة", "Cohort chat")}
            </div>
            <div className="text-sm text-muted-foreground group-active:text-primary-foreground">
              {tr("دردشة جوه المنصة مع", "In-app chat with")}{" "}
              {me ? yearLabel(me.academicYear, lang) : tr("دفعتك", "your cohort")}
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-primary group-active:text-primary-foreground ltr:rotate-180" />
        </Link>
        <Link
          to="/community/assistant"
          className="card-lux press-gold group flex items-center gap-4 p-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/50 bg-background">
            <BrandMark className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-semibold">
              {tr("مساعد ماڤيا الذكي", "MAVIA AI assistant")}
            </div>
            <div className="text-sm text-muted-foreground group-active:text-primary-foreground">
              {tr("اسأله عن المنصة وإزاي تستخدمها", "Ask it about the platform and how to use it")}
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-primary group-active:text-primary-foreground ltr:rotate-180" />
        </Link>
      </div>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-bold">
            <span className="text-gold-gradient">{tr("جروبات الدفعات", "Cohort groups")}</span>
          </h2>
          {me?.isAdmin && (
            <AdminDialog
              triggerLabel={tr("إضافة جروب", "Add group")}
              title={tr("جروب جديد", "New group")}
              onSave={add}
            >
              <Field label={tr("اسم الجروب", "Group name")}>
                <Input
                  name="title"
                  placeholder={tr("مثال: جروب الفرقة الثانية", "e.g. Year 2 group")}
                />
              </Field>
              <Field label={tr("الرابط", "Link")}>
                <Input name="url" dir="ltr" placeholder="https://chat.whatsapp.com/..." />
              </Field>
              <Field label={tr("المنصة", "Platform")}>
                <select name="platform" className={selectClass} defaultValue="whatsapp">
                  {Object.entries(PLATFORMS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {tr(l[0], l[1])}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("الفرقة", "Year")}>
                <select name="year" className={selectClass} defaultValue="">
                  <option value="">{tr("كل الفرق", "All years")}</option>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {tr(y.label, y.labelEn)}
                    </option>
                  ))}
                </select>
              </Field>
            </AdminDialog>
          )}
        </div>
        {me?.isAdmin && (
          <div className="mb-5">
            <YearChips
              includeAll
              value={year}
              onChange={(v) => {
                setTouched(true);
                setYear(v);
              }}
            />
          </div>
        )}
        {!shown.length ? (
          <EmptyState title={tr("مفيش جروبات لسه", "No groups yet")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <div key={l.id} className="card-lux relative">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="press-gold flex items-center gap-3 rounded-[inherit] p-5"
                >
                  <div className="flex-1">
                    <div className="text-[11px] text-primary">
                      {(() => {
                        const p = PLATFORMS[l.platform] ?? PLATFORMS["other"]!;
                        return tr(p[0], p[1]);
                      })()}{" "}
                      • {yearLabel(l.academic_year, lang)}
                    </div>
                    <div className="mt-1 font-semibold">{l.title}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
                {me?.isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-2 end-2"
                    onClick={() => remove(l.id)}
                    aria-label={tr("مسح", "Delete")}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
