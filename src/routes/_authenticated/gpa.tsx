import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";

import { computeGpa, gradeFor, MAX_MARKS, rowTotal, type GpaRow } from "@/lib/gpa";
import { PageHeader } from "@/components/mavia/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/gpa")({
  head: () => ({
    meta: [
      { title: "حاسبة GPA — ماڤيا" },
      { name: "description", content: "احسب معدلك التراكمي من درجات الميد والتكليفات والفاينل." },
      { property: "og:title", content: "حاسبة GPA — ماڤيا" },
      { property: "og:description", content: "احسب الـ GPA بتاعك بسهولة." },
    ],
  }),
  component: GpaPage,
});

const STORAGE_KEY = "mavia-gpa-rows";
let counter = 0;
const newRow = (): GpaRow => ({
  id: `${Date.now()}-${counter++}`,
  name: "",
  hours: 3,
  midterm: 0,
  coursework: 0,
  final: 0,
});

function GpaPage() {
  const [rows, setRows] = useState<GpaRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      setRows(Array.isArray(saved) && saved.length ? saved : [newRow(), newRow(), newRow()]);
    } catch {
      setRows([newRow(), newRow(), newRow()]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows, loaded]);

  const update = (id: string, patch: Partial<GpaRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const { gpa, hours } = computeGpa(rows);
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div>
      <PageHeader
        eyebrow="GPA"
        title="حاسبة الـ GPA"
        description="اكتب درجاتك في كل مادة: الميد وأعمال السنة (التكليفات) والفاينل، والحاسبة هتطلعلك التقدير والمعدل."
        action={
          <>
            <Button variant="outline" onClick={() => setRows([newRow(), newRow(), newRow()])}>
              <RotateCcw /> تفريغ
            </Button>
            <Button onClick={() => setRows((r) => [...r, newRow()])}>
              <Plus /> مادة
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card-lux border-primary/50 p-6 text-center shadow-gold sm:col-span-1">
          <div className="text-sm text-muted-foreground">المعدل GPA</div>
          <div className="mt-1 font-latin text-6xl font-bold text-gold-gradient">{gpa.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">من 4.00</div>
        </div>
        <div className="card-lux p-6 text-center">
          <div className="text-sm text-muted-foreground">إجمالي الساعات</div>
          <div className="mt-1 font-latin text-5xl font-bold">{hours}</div>
        </div>
        <div className="card-lux p-6 text-center">
          <div className="text-sm text-muted-foreground">عدد المواد</div>
          <div className="mt-1 font-latin text-5xl font-bold">{rows.length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-accent text-accent-foreground">
              <th className="p-3 text-right font-semibold">المادة</th>
              <th className="p-3 font-semibold">الساعات</th>
              <th className="p-3 font-semibold">الميد /{MAX_MARKS.midterm}</th>
              <th className="p-3 font-semibold">أعمال السنة /{MAX_MARKS.coursework}</th>
              <th className="p-3 font-semibold">الفاينل /{MAX_MARKS.final}</th>
              <th className="p-3 font-semibold">المجموع /100</th>
              <th className="p-3 font-semibold">التقدير</th>
              <th className="p-3 font-semibold">النقاط</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = rowTotal(r);
              const g = gradeFor(total);
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-2">
                    <Input
                      value={r.name}
                      placeholder="اسم المادة"
                      onChange={(e) => update(r.id, { name: e.target.value })}
                    />
                  </td>
                  {(["hours", "midterm", "coursework", "final"] as const).map((k) => (
                    <td key={k} className="p-2">
                      <Input
                        type="number"
                        min={0}
                        max={k === "hours" ? 6 : MAX_MARKS[k]}
                        value={r[k] || ""}
                        placeholder="0"
                        dir="ltr"
                        className="w-20 text-center"
                        onChange={(e) => update(r.id, { [k]: num(e.target.value) })}
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center font-latin text-lg font-bold">{total}</td>
                  <td className="p-2 text-center">
                    <span
                      className={
                        g.letter === "F"
                          ? "rounded-full bg-destructive/20 px-3 py-1 text-destructive"
                          : "rounded-full bg-accent px-3 py-1 text-primary"
                      }
                    >
                      {g.letter} • {g.label}
                    </span>
                  </td>
                  <td className="p-2 text-center font-semibold">{g.points.toFixed(1)}</td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="مسح المادة"
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="ml-1">سلم التقديرات:</span>
        {[
          ["90+", "A", "4.0"],
          ["85", "A-", "3.7"],
          ["80", "B+", "3.3"],
          ["75", "B", "3.0"],
          ["70", "C+", "2.7"],
          ["65", "C", "2.4"],
          ["60", "D+", "2.2"],
          ["50", "D", "2.0"],
          ["<50", "F", "0"],
        ].map(([m, l, p]) => (
          <span key={l} className="rounded-full border border-border px-2.5 py-1">
            {m} → {l} ({p})
          </span>
        ))}
      </div>
    </div>
  );
}
