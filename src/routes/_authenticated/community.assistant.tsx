import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/mavia/brand";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/community/assistant")({
  head: () => ({
    meta: [
      { title: "مساعد ماڤيا الذكي" },
      { name: "description", content: "اسأل مساعد ماڤيا الذكي عن المنصة وأقسامها." },
      { property: "og:title", content: "مساعد ماڤيا الذكي" },
      { property: "og:description", content: "مساعد ذكي للتعرف على منصة ماڤيا." },
    ],
  }),
  component: AssistantPage,
});

const SUGGESTIONS: [string, string][] = [
  ["إيه هي منصة ماڤيا؟", "What is MAVIA?"],
  ["إزاي أحسب الـ GPA بتاعي؟", "How do I calculate my GPA?"],
  ["لوحة التصدر بتتحسب إزاي؟", "How is the leaderboard calculated?"],
  ["أبدأ أتعلم GIS منين؟", "Where should I start learning GIS?"],
];

function AssistantPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { tr, lang } = useLang();
  const langRef = useRef(lang);
  langRef.current = lang;
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        body: () => ({ lang: langRef.current }),
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: (err) => {
      const msg = err.message ?? "";
      if (msg.includes("429"))
        toast.error(
          tr(
            "ضغط كبير على المساعد، استنى شوية وجرّب تاني.",
            "The assistant is busy, try again shortly.",
          ),
        );
      else if (msg.includes("402"))
        toast.error(tr("رصيد المساعد خلص مؤقتًا.", "The assistant is out of credits for now."));
      else
        toast.error(
          tr("المساعد مش متاح دلوقتي، حاول تاني.", "The assistant is unavailable, try again."),
        );
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  function ask(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] max-w-3xl flex-col lg:h-[calc(100vh-9rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowRight className="ltr:rotate-180" /> Community
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <BrandMark className="h-8 w-8" />
          <div className="font-display text-xl font-bold text-gold-gradient">
            {tr("مساعد ماڤيا", "MAVIA assistant")}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            stop();
            setMessages([]);
          }}
        >
          <RotateCcw /> {tr("محادثة جديدة", "New chat")}
        </Button>
      </div>

      <div className="card-lux flex min-h-0 flex-1 flex-col overflow-hidden">
        <Conversation className="min-h-0">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <BrandMark className="h-20 w-20 animate-float" />
                <div>
                  <div className="font-display text-2xl font-bold">
                    {tr("أهلًا! أنا مساعد ماڤيا", "Hi! I’m the MAVIA assistant")}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tr(
                      "اسألني أي حاجة عن المنصة وأقسامها، أو عن المذاكرة والـ GIS والبرمجة.",
                      "Ask me anything about the platform, studying, GIS or programming.",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s[1]} variant="chip" size="sm" onClick={() => ask(tr(s[0], s[1]))}>
                      {tr(s[0], s[1])}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        m.role === "assistant" ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : (
                          <p key={i} className="whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>{tr("بيفكر...", "Thinking...")}</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => ask(msg.text)}>
            <PromptInputTextarea
              ref={textareaRef}
              placeholder={tr("اكتب سؤالك هنا...", "Type your question...")}
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
