import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useMe } from "@/hooks/use-me";
import { yearLabel } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/community/chat")({
  head: () => ({
    meta: [
      { title: "شات الدفعة — ماڤيا" },
      { name: "description", content: "دردشة مباشرة بين طلاب الدفعة جوه منصة ماڤيا." },
      { property: "og:title", content: "شات الدفعة — ماڤيا" },
      { property: "og:description", content: "دردشة الدفعة على ماڤيا." },
    ],
  }),
  component: ChatPage,
});

type Msg = Tables<"chat_messages">;

function ChatPage() {
  const { data: me } = useMe();
  const { tr, lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const year = me?.academicYear;

  useEffect(() => {
    if (!year) return;
    let active = true;
    supabase
      .from("chat_messages")
      .select("*")
      .eq("academic_year", year)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (active && data) setMessages(data.reverse());
      });

    const channel = supabase
      .channel(`cohort-chat-${year}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `academic_year=eq.${year}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const id = (payload.old as Partial<Msg>).id;
          setMessages((list) => list.filter((x) => x.id !== id));
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [year]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !me) return;
    setSending(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ content, user_id: me.id })
      .select()
      .single();
    setSending(false);
    if (error) {
      toast.error(tr("الرسالة ما اتبعتتش، حاول تاني.", "Message not sent, try again."));
      return;
    }
    setText("");
    setMessages((list) => (list.some((x) => x.id === data.id) ? list : [...list, data]));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((list) => list.filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] max-w-3xl flex-col lg:h-[calc(100vh-9rem)]">
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowRight className="ltr:rotate-180" /> Community
          </Link>
        </Button>
        <div className="text-end">
          <div className="font-display text-xl font-bold text-gold-gradient">
            {tr("شات الدفعة", "Cohort chat")}
          </div>
          <div className="text-xs text-muted-foreground">{yearLabel(year, lang)}</div>
        </div>
      </div>

      <div className="card-lux flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {tr("ابدأ أول رسالة في شات الدفعة 👋", "Send the first message to your cohort 👋")}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === me?.id;
          return (
            <div key={m.id} className={cn("group flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  mine
                    ? "rounded-ee-sm bg-primary text-primary-foreground"
                    : "rounded-es-sm border border-border bg-secondary text-secondary-foreground",
                )}
              >
                {!mine && (
                  <div className="mb-0.5 text-xs font-semibold text-primary">{m.sender_name}</div>
                )}
                <div className="text-sm leading-6 break-words whitespace-pre-wrap">{m.content}</div>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-2 text-[10px]",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {new Date(m.created_at).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {(mine || me?.isAdmin) && (
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={tr("مسح الرسالة", "Delete message")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr("اكتب رسالة لدفعتك...", "Write to your cohort...")}
          maxLength={2000}
          className="h-12"
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="h-12 w-12"
          disabled={sending || !text.trim()}
          aria-label={tr("إرسال", "Send")}
        >
          <Send className="rtl:-scale-x-100" />
        </Button>
      </form>
    </div>
  );
}
