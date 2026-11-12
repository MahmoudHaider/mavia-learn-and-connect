export interface GpaRow {
  id: string;
  name: string;
  hours: number;
  midterm: number;
  coursework: number;
  final: number;
  /** false = subject outside the GPA (its hours do not count) */
  inGpa: boolean;
}

/** Maximum marks per component (total 100): midterm 30, coursework 30, final 40. */
export const MAX_MARKS = { midterm: 30, coursework: 30, final: 40 } as const;

/** Default semester: 3 subjects of 3 hours, 4 subjects of 2 hours, 1 subject outside the GPA. */
export const DEFAULT_SEMESTER: Array<{ hours: number; inGpa: boolean }> = [
  { hours: 3, inGpa: true },
  { hours: 3, inGpa: true },
  { hours: 3, inGpa: true },
  { hours: 2, inGpa: true },
  { hours: 2, inGpa: true },
  { hours: 2, inGpa: true },
  { hours: 2, inGpa: true },
  { hours: 2, inGpa: false },
];

export interface GradeInfo {
  letter: string;
  points: number;
  label: string;
  labelEn: string;
}

const SCALE: Array<{ min: number } & GradeInfo> = [
  { min: 90, letter: "A", points: 4.0, label: "امتياز", labelEn: "Excellent" },
  { min: 85, letter: "A-", points: 3.7, label: "امتياز", labelEn: "Excellent" },
  { min: 80, letter: "B+", points: 3.3, label: "جيد جدًا", labelEn: "Very good" },
  { min: 75, letter: "B", points: 3.0, label: "جيد جدًا", labelEn: "Very good" },
  { min: 70, letter: "C+", points: 2.7, label: "جيد", labelEn: "Good" },
  { min: 65, letter: "C", points: 2.4, label: "جيد", labelEn: "Good" },
  { min: 60, letter: "D+", points: 2.2, label: "مقبول", labelEn: "Pass" },
  { min: 50, letter: "D", points: 2.0, label: "مقبول", labelEn: "Pass" },
  { min: 0, letter: "F", points: 0, label: "راسب", labelEn: "Fail" },
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
  return { letter: g.letter, points: g.points, label: g.label, labelEn: g.labelEn };
}

/** A row with no marks typed yet is not counted. */
export function hasMarks(r: Pick<GpaRow, "midterm" | "coursework" | "final">): boolean {
  return (r.midterm || 0) + (r.coursework || 0) + (r.final || 0) > 0;
}

export function computeGpa(rows: GpaRow[]): { gpa: number; hours: number } {
  let hours = 0;
  let weighted = 0;
  for (const r of rows) {
    if (r.inGpa === false || !hasMarks(r)) continue;
    const h = Number.isFinite(r.hours) && r.hours > 0 ? r.hours : 0;
    if (!h) continue;
    hours += h;
    weighted += gradeFor(rowTotal(r)).points * h;
  }
  return { gpa: hours ? Math.round((weighted / hours) * 100) / 100 : 0, hours };
}
