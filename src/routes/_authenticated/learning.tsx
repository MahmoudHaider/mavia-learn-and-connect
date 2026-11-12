import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Globe, PlayCircle, Link2, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { EmptyState, PageHeader } from "@/components/mavia/page-header";
import { AdminDialog, Field, required, selectClass, str } from "@/components/mavia/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning — ماڤيا" },
      { name: "description", content: "فيديوهات يوتيوب ومنصات تعليمية في GIS والبرمجة." },
      { property: "og:title", content: "Learning — ماڤيا" },
      { property: "og:description", content: "روابط تعليمية مختارة في GIS والبرمجة." },
    ],
  }),
  component: LearningPage,
});

const CATS = [
  { value: "all", label: "الكل" },
  { value: "youtube", label: "يوتيوب" },
  { value: "platform", label: "منصات" },
  { value: "other", label: "روابط تانية" },
] as const;

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

function safeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function LearningPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>("all");
  const [topic, setTopic] = useState<string | null>(null);

  const links = useQuery({
    queryKey: ["learning"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const topics = Array.from(new Set((links.data ?? []).map((l) => l.topic).filter(Boolean))) as string[];
  const shown = (links.data ?? []).filter(
    (l) => (cat === "all" || l.category === cat) && (!topic || l.topic === topic),
  );

  async function add(form: FormData) {
    const { error } = await supabase.from("learning_links").insert({
      title: required(form, "title", "العنوان"),
      url: safeUrl(required(form, "url", "الرابط")),
      category: str(form, "category") || "youtube",
      topic: str(form, "topic") || null,
      description: str(form, "description") || null,
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["learning"] });
  }
  async function remove(id: string) {
    if (!confirm("تمسح الرابط ده؟")) return;
    await supabase.from("learning_links").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["learning"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title="اتعلّم"
        description="فيديوهات يوتيوب ومنصات تعليمية في الـ GIS والبرمجة، بضغطة تروح على المصدر على طول."
        action={
          me?.isAdmin && (
            <AdminDialog triggerLabel="إضافة رابط" title="رابط تعليمي جديد" onSave={add}>
              <Field label="العنوان">
                <Input name="title" placeholder="مثال: كورس ArcGIS للمبتدئين" />
              </Field>
              <Field label="الرابط">
                <Input name="url" dir="ltr" placeholder="https://youtube.com/..." />
              </Field>
              <Field label="النوع">
                <select name="category" className={selectClass} defaultValue="youtube">
                  <option value="youtube">يوتيوب</option>
                  <option value="platform">منصة تعليمية</option>
                  <option value="other">رابط تاني</option>
                </select>
              </Field>
              <Field label="المجال (اختياري)">
                <Input name="topic" placeholder="GIS / Python / Web ..." list="topics" />
                <datalist id="topics">
                  {["GIS", "Remote Sensing", "Python", "برمجة", "Web"].map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="وصف (اختياري)">
                <Textarea name="description" rows={2} />
              </Field>
            </AdminDialog>
          )
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Button key={c.value} size="sm" variant="chip" data-active={cat === c.value} onClick={() => setCat(c.value)}>
            {c.label}
          </Button>
        ))}
      </div>
      {topics.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button size="xs" variant="chip" data-active={topic === null} onClick={() => setTopic(null)}>
            كل المجالات
          </Button>
          {topics.map((t) => (
            <Button key={t} size="xs" variant="chip" data-active={topic === t} onClick={() => setTopic(t)}>
              #{t}
            </Button>
          ))}
        </div>
      )}

      {links.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : !shown.length ? (
        <EmptyState title="مفيش روابط هنا لسه" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => {
            const yt = youtubeId(l.url);
            const Icon = l.category === "youtube" ? PlayCircle : l.category === "platform" ? Globe : Link2;
            return (
              <div key={l.id} className="card-lux group relative overflow-hidden">
                <a href={l.url} target="_blank" rel="noreferrer" className="press-gold block">
                  {yt ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                        <PlayCircle className="h-12 w-12 text-primary drop-shadow-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid-contours flex aspect-video items-center justify-center">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      {CATS.find((c) => c.value === l.category)?.label}
                      {l.topic && <span className="text-primary">#{l.topic}</span>}
                    </div>
                    <h3 className="mt-2 font-semibold">{l.title}</h3>
                    {l.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>}
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                      افتح <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </a>
                {me?.isAdmin && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="absolute top-3 left-3"
                    onClick={() => remove(l.id)}
                    aria-label="مسح"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
