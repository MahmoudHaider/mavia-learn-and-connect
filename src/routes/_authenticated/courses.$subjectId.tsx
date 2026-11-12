import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ExternalLink, FileText, ListChecks, Play, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { yearLabel } from "@/lib/phone";
import { EmptyState, PageHeader } from "@/components/mavia/page-header";
import { AdminDialog, Field, required, str } from "@/components/mavia/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/courses/$subjectId")({
  head: () => ({
    meta: [
      { title: "المادة — ماڤيا" },
      { name: "description", content: "ملخصات واختبارات المادة على ماڤيا." },
      { property: "og:title", content: "المادة — ماڤيا" },
      { property: "og:description", content: "ملخصات واختبارات المادة." },
    ],
  }),
  component: SubjectPage,
});

function SubjectPage() {
  const { subjectId } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { tr, lang } = useLang();
  const [tab, setTab] = useState<"summaries" | "quizzes">("summaries");

  const subject = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const summaries = useQuery({
    queryKey: ["summaries", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const quizzes = useQuery({
    queryKey: ["quizzes", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(count)")
        .eq("subject_id", subjectId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const attempts = useQuery({
    queryKey: ["my-attempts", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, total")
        .eq("user_id", me!.id);
      if (error) throw error;
      return data;
    },
  });

  function bestFor(quizId: string) {
    const list = (attempts.data ?? []).filter((a) => a.quiz_id === quizId);
    if (!list.length) return null;
    return list.reduce((b, a) => (a.score > b.score ? a : b));
  }

  async function addSummary(form: FormData) {
    const { error } = await supabase.from("summaries").insert({
      subject_id: subjectId,
      title: required(form, "title", tr("العنوان", "Title")),
      content: str(form, "content") || null,
      link_url: str(form, "link") || null,
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["summaries", subjectId] });
  }
  async function addQuiz(form: FormData) {
    const { error } = await supabase.from("quizzes").insert({
      subject_id: subjectId,
      title: required(form, "title", tr("اسم الاختبار", "Quiz name")),
      description: str(form, "description") || null,
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["quizzes", subjectId] });
  }
  async function del(table: "summaries" | "quizzes", id: string) {
    if (!confirm(tr("متأكد من المسح؟", "Delete this?"))) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: [table, subjectId] });
  }

  if (subject.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  if (!subject.data)
    return <EmptyState title={tr("المادة دي مش موجودة", "This subject does not exist")} />;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/courses">
          <ArrowRight className="ltr:rotate-180" /> {tr("رجوع للكورسات", "Back to courses")}
        </Link>
      </Button>
      <PageHeader
        eyebrow={yearLabel(subject.data.academic_year, lang)}
        title={subject.data.title}
        description={subject.data.description ?? undefined}
        action={
          me?.isAdmin &&
          (tab === "summaries" ? (
            <AdminDialog
              triggerLabel={tr("إضافة ملخص", "Add summary")}
              title={tr("ملخص جديد", "New summary")}
              onSave={addSummary}
            >
              <Field label={tr("العنوان", "Title")}>
                <Input
                  name="title"
                  placeholder={tr("مثال: ملخص الشابتر الأول", "e.g. Chapter 1 summary")}
                />
              </Field>
              <Field label={tr("محتوى الملخص (اختياري)", "Summary text (optional)")}>
                <Textarea name="content" rows={6} />
              </Field>
              <Field label={tr("رابط ملف PDF أو Drive (اختياري)", "PDF or Drive link (optional)")}>
                <Input name="link" dir="ltr" placeholder="https://..." />
              </Field>
            </AdminDialog>
          ) : (
            <AdminDialog
              triggerLabel={tr("إضافة اختبار", "Add quiz")}
              title={tr("اختبار جديد", "New quiz")}
              onSave={addQuiz}
            >
              <Field label={tr("اسم الاختبار", "Quiz name")}>
                <Input
                  name="title"
                  placeholder={tr("مثال: اختبار شامل على الميد", "e.g. Midterm review quiz")}
                />
              </Field>
              <Field label={tr("وصف (اختياري)", "Description (optional)")}>
                <Textarea name="description" rows={3} />
              </Field>
              <p className="text-xs text-muted-foreground">
                {tr(
                  "بعد الحفظ افتح الاختبار وضيف الأسئلة.",
                  "After saving, open the quiz to add questions.",
                )}
              </p>
            </AdminDialog>
          ))
        }
      />

      <div className="mb-6 flex gap-2">
        <Button
          variant="chip"
          data-active={tab === "summaries"}
          onClick={() => setTab("summaries")}
        >
          <FileText /> {tr("الملخصات", "Summaries")}
        </Button>
        <Button variant="chip" data-active={tab === "quizzes"} onClick={() => setTab("quizzes")}>
          <ListChecks /> {tr("الاختبارات", "Quizzes")}
        </Button>
      </div>

      {tab === "summaries" ? (
        !summaries.data?.length ? (
          <EmptyState title={tr("مفيش ملخصات لسه", "No summaries yet")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {summaries.data.map((s) => (
              <article key={s.id} className="card-lux p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-primary">{s.title}</h3>
                  {me?.isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => del("summaries", s.id)}
                      aria-label={tr("مسح", "Delete")}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                {s.content && (
                  <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-foreground/85">
                    {s.content}
                  </p>
                )}
                {s.link_url && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a href={s.link_url} target="_blank" rel="noreferrer">
                      <ExternalLink /> {tr("افتح الملف", "Open file")}
                    </a>
                  </Button>
                )}
              </article>
            ))}
          </div>
        )
      ) : !quizzes.data?.length ? (
        <EmptyState title={tr("مفيش اختبارات لسه", "No quizzes yet")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.data.map((q) => {
            const best = bestFor(q.id);
            const count = (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <div key={q.id} className="card-lux flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{q.title}</h3>
                  {me?.isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => del("quizzes", q.id)}
                      aria-label={tr("مسح", "Delete")}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
                {q.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {count} {tr("سؤال", "questions")}
                    {best && (
                      <span className="ms-2 text-primary">
                        • {tr("أعلى درجة", "Best")}: {best.score}/{best.total}
                      </span>
                    )}
                  </span>
                  <Button asChild size="sm">
                    <Link to="/quiz/$quizId" params={{ quizId: q.id }}>
                      <Play className="rtl:-scale-x-100" />{" "}
                      {me?.isAdmin
                        ? tr("افتح / ضيف أسئلة", "Open / add questions")
                        : best
                          ? tr("حل تاني", "Retake")
                          : tr("ابدأ", "Start")}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
