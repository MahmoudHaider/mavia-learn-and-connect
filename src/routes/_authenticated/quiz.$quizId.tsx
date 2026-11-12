import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { EmptyState, PageHeader } from "@/components/mavia/page-header";
import { AdminDialog, Field, required } from "@/components/mavia/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quiz/$quizId")({
  head: () => ({
    meta: [
      { title: "اختبار — ماڤيا" },
      { name: "description", content: "حل الاختبار واجمع نقاط في لوحة التصدر." },
      { property: "og:title", content: "اختبار — ماڤيا" },
      { property: "og:description", content: "اختبارات شاملة على ماڤيا." },
    ],
  }),
  component: QuizPage,
});

interface Result {
  score: number;
  total: number;
  results: { question_id: string; correct_index: number | null; chosen: number | null }[];
}

function QuizPage() {
  const { quizId } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const quiz = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, subjects(id, title)")
        .eq("id", quizId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const questions = useQuery({
    queryKey: ["questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return data.map((q) => ({ ...q, options: (q.options as string[]) ?? [] }));
    },
  });
  const keys = useQuery({
    queryKey: ["answer-keys", quizId],
    enabled: !!me?.isAdmin && !!questions.data?.length,
    queryFn: async () => {
      const ids = questions.data!.map((q) => q.id);
      const { data, error } = await supabase
        .from("quiz_answer_keys")
        .select("*")
        .in("question_id", ids);
      if (error) throw error;
      return Object.fromEntries(data.map((k) => [k.question_id, k.correct_index]));
    },
  });

  async function addQuestion(form: FormData) {
    const question = required(form, "question", "السؤال");
    const options = [0, 1, 2, 3].map((i) => String(form.get(`opt${i}`) ?? "").trim()).filter(Boolean);
    if (options.length < 2) throw new Error("لازم اختيارين على الأقل");
    const correct = Number(form.get("correct") ?? -1);
    if (correct < 0 || correct >= options.length) throw new Error("اختار الإجابة الصحيحة من الاختيارات المكتوبة");
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert({ quiz_id: quizId, question, options, position: questions.data?.length ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: keyErr } = await supabase
      .from("quiz_answer_keys")
      .insert({ question_id: data.id, correct_index: correct });
    if (keyErr) throw new Error(keyErr.message);
    qc.invalidateQueries({ queryKey: ["questions", quizId] });
    qc.invalidateQueries({ queryKey: ["answer-keys", quizId] });
  }

  async function deleteQuestion(id: string) {
    if (!confirm("تمسح السؤال ده؟")) return;
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["questions", quizId] });
  }

  async function submit() {
    const qs = questions.data ?? [];
    if (Object.keys(answers).length < qs.length && !confirm("فيه أسئلة ما جاوبتهاش، تسلّم برضه؟")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_quiz", { _quiz_id: quizId, _answers: answers });
    setBusy(false);
    if (error) { toast.error("ما قدرناش نسلّم الاختبار، حاول تاني."); return; }
    setResult(data as unknown as Result);
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
    qc.invalidateQueries({ queryKey: ["my-attempts"] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (quiz.isLoading || questions.isLoading)
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  if (!quiz.data) return <EmptyState title="الاختبار ده مش موجود" />;

  const subject = quiz.data.subjects as unknown as { id: string; title: string } | null;
  const qs = questions.data ?? [];
  const resultMap = new Map(result?.results.map((r) => [r.question_id, r]));

  return (
    <div className="mx-auto max-w-3xl">
      {subject && (
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/courses/$subjectId" params={{ subjectId: subject.id }}>
            <ArrowRight /> {subject.title}
          </Link>
        </Button>
      )}
      <PageHeader
        eyebrow="Quiz"
        title={quiz.data.title}
        description={quiz.data.description ?? undefined}
        action={
          me?.isAdmin && (
            <AdminDialog triggerLabel="إضافة سؤال" title="سؤال جديد" onSave={addQuestion}>
              <Field label="السؤال">
                <Textarea name="question" rows={3} />
              </Field>
              <div className="space-y-2">
                <span className="text-sm font-medium">الاختيارات (علّم الصح)</span>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      value={i}
                      defaultChecked={i === 0}
                      className="h-4 w-4 accent-[var(--gold)]"
                      aria-label={`الاختيار ${i + 1} صح`}
                    />
                    <Input name={`opt${i}`} placeholder={`اختيار ${i + 1}${i > 1 ? " (اختياري)" : ""}`} />
                  </div>
                ))}
              </div>
            </AdminDialog>
          )
        }
      />

      {result && (
        <div className="card-lux animate-rise mb-8 border-primary/60 p-6 text-center shadow-gold">
          <div className="text-sm text-muted-foreground">نتيجتك</div>
          <div className="mt-1 font-latin text-5xl font-bold text-gold-gradient">
            {result.score}/{result.total}
          </div>
          <p className="mt-2 text-sm">
            {result.score === result.total ? "ممتاز! الدرجة النهائية 🏆" : "اتضافت أعلى درجة ليك للوحة التصدر."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            <RotateCcw /> حل تاني
          </Button>
        </div>
      )}

      {!qs.length ? (
        <EmptyState title="الاختبار ده لسه مفيهوش أسئلة" />
      ) : (
        <div className="space-y-5">
          {qs.map((q, qi) => {
            const r = resultMap.get(q.id);
            const adminCorrect = keys.data?.[q.id];
            return (
              <div key={q.id} className="card-lux p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-sans text-base leading-7 font-semibold">
                    <span className="ml-2 font-latin text-primary">{qi + 1}.</span>
                    {q.question}
                  </h3>
                  {me?.isAdmin && (
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteQuestion(q.id)} aria-label="مسح السؤال">
                      <Trash2 />
                    </Button>
                  )}
                </div>
                <div className="mt-4 grid gap-2">
                  {q.options.map((opt, oi) => {
                    const chosen = answers[q.id] === oi;
                    const isCorrect = r ? r.correct_index === oi : adminCorrect === oi;
                    const isWrongPick = r && r.chosen === oi && r.correct_index !== oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={!!result}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "press-gold flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-right text-sm hover:border-primary/60",
                          chosen && !result && "border-primary bg-primary text-primary-foreground",
                          (r || me?.isAdmin) && isCorrect && "border-success text-success",
                          isWrongPick && "border-destructive text-destructive",
                        )}
                      >
                        <span>{opt}</span>
                        {(r || me?.isAdmin) && isCorrect && <Check className="h-4 w-4" />}
                        {isWrongPick && <X className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!result && (
            <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              تسليم الاختبار
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
