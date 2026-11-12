export interface GpaRow {
  id: string;
  name: string;
  hours: number;
  midterm: number;
  coursework: number;
  final: number;
}

/** Maximum marks per component (total 100). */
export const MAX_MARKS = { midterm: 20, coursework: 20, final: 60 } as const;

export interface GradeInfo {
  letter: string;
  points: number;
  label: string;
}

const SCALE: Array<{ min: number } & GradeInfo> = [
  { min: 90, letter: "A", points: 4.0, label: "امتياز" },
  { min: 85, letter: "A-", points: 3.7, label: "امتياز" },
  { min: 80, letter: "B+", points: 3.3, label: "جيد جدًا" },
  { min: 75, letter: "B", points: 3.0, label: "جيد جدًا" },
  { min: 70, letter: "C+", points: 2.7, label: "جيد" },
  { min: 65, letter: "C", points: 2.4, label: "جيد" },
  { min: 60, letter: "D+", points: 2.2, label: "مقبول" },
  { min: 50, letter: "D", points: 2.0, label: "مقبول" },
  { min: 0, letter: "F", points: 0, label: "راسب" },
];

function clamp(n: number, max: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}

export function rowTotal(row: Pick<GpaRow, "midterm" | "coursework" | "final">): number {
  return (
    clamp(row.midterm, MAX_MARKS.midterm) +
    clamp(row.coursework, MAX_MARKS.coursework) +
    clamp(row.final, MAX_MARKS.final)
  );
}

export function gradeFor(total: number): GradeInfo {
  const t = clamp(total, 100);
  const g = SCALE.find((s) => t >= s.min)!;
  return { letter: g.letter, points: g.points, label: g.label };
}

export function computeGpa(rows: GpaRow[]): { gpa: number; hours: number } {
  let hours = 0;
  let weighted = 0;
  for (const r of rows) {
    const h = Number.isFinite(r.hours) && r.hours > 0 ? r.hours : 0;
    if (!h) continue;
    hours += h;
    weighted += gradeFor(rowTotal(r)).points * h;
  }
  return { gpa: hours ? Math.round((weighted / hours) * 100) / 100 : 0, hours };
}
