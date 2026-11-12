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
import { useLang } from "@/lib/i18n";

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
  { value: "all", label: "الكل", en: "All" },
  { value: "youtube", label: "يوتيوب", en: "YouTube" },
  { value: "platform", label: "منصات", en: "Platforms" },
  { value: "other", label: "روابط تانية", en: "Other links" },
] as const;

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
  );
  return m?.[1] ?? null;
}

function safeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function LearningPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { tr } = useLang();
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

  const topics = Array.from(
    new Set((links.data ?? []).map((l) => l.topic).filter(Boolean)),
  ) as string[];
  const shown = (links.data ?? []).filter(
    (l) => (cat === "all" || l.category === cat) && (!topic || l.topic === topic),
  );

  async function add(form: FormData) {
    const { error } = await supabase.from("learning_links").insert({
      title: required(form, "title", tr("العنوان", "Title")),
      url: safeUrl(required(form, "url", tr("الرابط", "Link"))),
      category: str(form, "category") || "youtube",
      topic: str(form, "topic") || null,
      description: str(form, "description") || null,
    });
    if (error) throw new Error(error.message);
    qc.invalidateQueries({ queryKey: ["learning"] });
  }
  async function remove(id: string) {
    if (!confirm(tr("تمسح الرابط ده؟", "Delete this link?"))) return;
    await supabase.from("learning_links").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["learning"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Learning"
        title={tr("اتعلّم", "Learning")}
        description={tr(
          "فيديوهات يوتيوب ومنصات تعليمية في الـ GIS والبرمجة، بضغطة تروح على المصدر على طول.",
          "YouTube videos and learning platforms for GIS and programming — one tap takes you straight there.",
        )}
        action={
          me?.isAdmin && (
            <AdminDialog
              triggerLabel={tr("إضافة رابط", "Add link")}
              title={tr("رابط تعليمي جديد", "New learning link")}
              onSave={add}
            >
              <Field label={tr("العنوان", "Title")}>
                <Input
                  name="title"
                  placeholder={tr("مثال: كورس ArcGIS للمبتدئين", "e.g. ArcGIS for beginners")}
                />
              </Field>
              <Field label={tr("الرابط", "Link")}>
                <Input name="url" dir="ltr" placeholder="https://youtube.com/..." />
              </Field>
              <Field label={tr("النوع", "Type")}>
                <select name="category" className={selectClass} defaultValue="youtube">
                  <option value="youtube">{tr("يوتيوب", "YouTube")}</option>
                  <option value="platform">{tr("منصة تعليمية", "Learning platform")}</option>
                  <option value="other">{tr("رابط تاني", "Other link")}</option>
                </select>
              </Field>
              <Field label={tr("المجال (اختياري)", "Topic (optional)")}>
                <Input name="topic" placeholder="GIS / Python / Web ..." list="topics" />
                <datalist id="topics">
                  {["GIS", "Remote Sensing", "Python", "برمجة", "Web"].map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label={tr("وصف (اختياري)", "Description (optional)")}>
                <Textarea name="description" rows={2} />
              </Field>
            </AdminDialog>
          )
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant="chip"
            data-active={cat === c.value}
            onClick={() => setCat(c.value)}
          >
            {tr(c.label, c.en)}
          </Button>
        ))}
      </div>
      {topics.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="chip"
            data-active={topic === null}
            onClick={() => setTopic(null)}
          >
            {tr("كل المجالات", "All topics")}
          </Button>
          {topics.map((t) => (
            <Button
              key={t}
              size="xs"
              variant="chip"
              data-active={topic === t}
              onClick={() => setTopic(t)}
            >
              #{t}
            </Button>
          ))}
        </div>
      )}

      {links.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : !shown.length ? (
        <EmptyState title={tr("مفيش روابط هنا لسه", "No links here yet")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((l) => {
            const yt = youtubeId(l.url);
            const Icon =
              l.category === "youtube" ? PlayCircle : l.category === "platform" ? Globe : Link2;
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
                      {(() => {
                        const c = CATS.find((c) => c.value === l.category);
                        return c ? tr(c.label, c.en) : "";
                      })()}
                      {l.topic && <span className="text-primary">#{l.topic}</span>}
                    </div>
                    <h3 className="mt-2 font-semibold">{l.title}</h3>
                    {l.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {l.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                      {tr("افتح", "Open")} <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </a>
                {me?.isAdmin && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="absolute top-3 end-3"
                    onClick={() => remove(l.id)}
                    aria-label={tr("مسح", "Delete")}
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
