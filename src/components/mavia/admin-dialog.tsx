import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Generic admin "add" dialog: renders a form and closes after a successful save. */
export function AdminDialog({
  triggerLabel,
  title,
  children,
  onSave,
}: {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  onSave: (form: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await onSave(form);
      toast.success("اتحفظ بنجاح");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصلت مشكلة في الحفظ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-xl text-primary">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {children}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            حفظ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export function required(form: FormData, key: string, label: string): string {
  const v = str(form, key);
  if (!v) throw new Error(`${label} مطلوب`);
  return v;
}
