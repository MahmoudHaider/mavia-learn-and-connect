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

const SUGGESTIONS = [
  "إيه هي منصة ماڤيا؟",
  "إزاي أحسب الـ GPA بتاعي؟",
  "لوحة التصدر بتتحسب إزاي؟",
  "أبدأ أتعلم GIS منين؟",
];

function AssistantPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
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
      if (msg.includes("429")) toast.error("ضغط كبير على المساعد، استنى شوية وجرّب تاني.");
      else if (msg.includes("402")) toast.error("رصيد المساعد خلص مؤقتًا.");
      else toast.error("المساعد مش متاح دلوقتي، حاول تاني.");
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
            <ArrowRight /> الكوميونتي
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <BrandMark className="h-8 w-8" />
          <div className="font-display text-xl font-bold text-gold-gradient">مساعد ماڤيا</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            stop();
            setMessages([]);
          }}
        >
          <RotateCcw /> محادثة جديدة
        </Button>
      </div>

      <div className="card-lux flex min-h-0 flex-1 flex-col overflow-hidden">
        <Conversation className="min-h-0">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <BrandMark className="h-20 w-20 animate-float" />
                <div>
                  <div className="font-display text-2xl font-bold">أهلًا! أنا مساعد ماڤيا</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    اسألني أي حاجة عن المنصة وأقسامها، أو عن المذاكرة والـ GIS والبرمجة.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="chip" size="sm" onClick={() => ask(s)}>
                      {s}
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
                  <Shimmer>بيفكر...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-3">
          <PromptInput onSubmit={(msg) => ask(msg.text)}>
            <PromptInputTextarea ref={textareaRef} placeholder="اكتب سؤالك هنا..." />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
