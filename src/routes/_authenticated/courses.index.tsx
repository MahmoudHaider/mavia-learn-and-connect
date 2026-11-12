import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { ACADEMIC_YEARS, yearLabel } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/mavia/page-header";
import { YearChips } from "@/components/mavia/year-chips";
import { AdminDialog, Field, required, selectClass, str } from "@/components/mavia/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/courses/")({
  head: () => ({
    meta: [
      { title: "الكورسات — ماڤيا" },
      { name: "description", content: "مواد كل دفعة بالملخصات والاختبارات." },
      { property: "og:title", content: "الكورسات — ماڤيا" },
      { property: "og:description", content: "مواد كل دفعة بالملخصات والاختبارات." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [year, setYear] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (me && !touched) setYear(me.academicYear);
  }, [me, touched]);

  const subjects = useQuery({
    queryKey: ["subjects", year],
    queryFn: async () => {
      let q = supabase
        .from("subjects")
        .select("*, summaries(count), quizzes(count)")
        .order("created_at", { ascending: true });
      if (year) q = q.eq("academic_year", year);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  async function addSubject(form: FormData) {
    const { error } = await supabase.from("subjects").insert({
      title: required(form, "title", "اسم المادة"),
      description: str(form, "description") || null,
      academic_year: Number(form.get("year")),
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["subjects"] });
  }

  async function remove(id: string) {
    if (!confirm("متأكد إنك عايز تمسح المادة دي بكل ملخصاتها واختباراتها؟")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    qc.invalidateQueries({ queryKey: ["subjects"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Courses"
        title="الكورسات"
        description="مواد كل دفعة على حدى، بملخصاتها واختباراتها الشاملة."
        action={
          me?.isAdmin && (
            <AdminDialog triggerLabel="إضافة مادة" title="مادة جديدة" onSave={addSubject}>
              <Field label="اسم المادة">
                <Input name="title" placeholder="مثال: نظم المعلومات الجغرافية" />
              </Field>
              <Field label="الفرقة">
                <select name="year" className={selectClass} defaultValue={year ?? 1}>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="وصف (اختياري)">
                <Textarea name="description" rows={3} />
              </Field>
            </AdminDialog>
          )
        }
      />

      <div className="mb-6">
        <YearChips
          includeAll
          value={year}
          onChange={(v) => {
            setTouched(true);
            setYear(v);
          }}
        />
      </div>

      {subjects.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !subjects.data?.length ? (
        <EmptyState
          title="مفيش مواد هنا لسه"
          hint={me?.isAdmin ? "ضيف أول مادة من زرار «إضافة مادة»." : "الأدمن هيضيف المواد قريب."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.data.map((s) => (
            <div key={s.id} className="card-lux group relative flex flex-col p-5">
              <Link
                to="/courses/$subjectId"
                params={{ subjectId: s.id }}
                className="absolute inset-0 z-0 rounded-[inherit]"
                aria-label={s.title}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {yearLabel(s.academic_year)}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              {s.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
                <span>
                  {(s.summaries as unknown as { count: number }[])[0]?.count ?? 0} ملخص •{" "}
                  {(s.quizzes as unknown as { count: number }[])[0]?.count ?? 0} اختبار
                </span>
                <span className="flex items-center gap-1 text-primary">
                  افتح <ChevronLeft className="h-4 w-4" />
                </span>
              </div>
              {me?.isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 left-14 z-10"
                  onClick={() => remove(s.id)}
                  aria-label="مسح المادة"
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
