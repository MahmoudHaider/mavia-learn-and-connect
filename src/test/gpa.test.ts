import { describe, expect, it } from "vitest";
import { computeGpa, DEFAULT_SEMESTER, gradeFor, rowTotal, type GpaRow } from "@/lib/gpa";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

const row = (p: Partial<GpaRow>): GpaRow => ({
  id: "x",
  name: "",
  hours: 3,
  midterm: 0,
  coursework: 0,
  final: 0,
  inGpa: true,
  ...p,
});

describe("GPA calculator", () => {
  it("adds midterm (/30), coursework (/30) and final (/40) into a total out of 100", () => {
    expect(rowTotal({ midterm: 27, coursework: 28, final: 35 })).toBe(90);
  });

  it("caps each component at 30 / 30 / 40", () => {
    expect(rowTotal({ midterm: 35, coursework: 40, final: 50 })).toBe(100);
  });

  it("gives 4.0 for 90+, and F below 50", () => {
    expect(gradeFor(90).points).toBe(4);
    expect(gradeFor(49).letter).toBe("F");
    expect(gradeFor(50).points).toBe(2);
  });

  it("weights subject points by credit hours", () => {
    const { gpa, hours } = computeGpa([
      row({ hours: 3, midterm: 30, coursework: 30, final: 35 }), // 95 -> 4.0
      row({ hours: 2, midterm: 25, coursework: 20, final: 30 }), // 75 -> 3.0
    ]);
    expect(hours).toBe(5);
    expect(gpa).toBe(3.6);
  });

  it("ignores the subject outside the GPA (its hours do not count)", () => {
    const { gpa, hours } = computeGpa([
      row({ hours: 3, midterm: 30, coursework: 30, final: 35 }),
      row({ hours: 2, midterm: 0, coursework: 0, final: 0, inGpa: false }),
    ]);
    expect(hours).toBe(3);
    expect(gpa).toBe(4);
  });

  it("does not count a subject whose marks are not typed yet", () => {
    const { gpa, hours } = computeGpa([
      row({ hours: 3, midterm: 30, coursework: 30, final: 35 }),
      row({ hours: 2 }),
    ]);
    expect(hours).toBe(3);
    expect(gpa).toBe(4);
  });

  it("default semester is 3 subjects x 3h, 4 subjects x 2h and 1 outside the GPA", () => {
    expect(DEFAULT_SEMESTER.filter((s) => s.inGpa && s.hours === 3)).toHaveLength(3);
    expect(DEFAULT_SEMESTER.filter((s) => s.inGpa && s.hours === 2)).toHaveLength(4);
    expect(DEFAULT_SEMESTER.filter((s) => !s.inGpa)).toHaveLength(1);
    expect(DEFAULT_SEMESTER.filter((s) => s.inGpa).reduce((a, s) => a + s.hours, 0)).toBe(17);
  });
});

describe("phone login", () => {
  it("normalizes Egyptian numbers including Arabic digits and +20", () => {
    expect(normalizePhone("+20 101 234 5678")).toBe("01012345678");
    expect(normalizePhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(phoneToEmail("010-1234-5678")).toBe("01012345678@mavia.app");
  });
});
