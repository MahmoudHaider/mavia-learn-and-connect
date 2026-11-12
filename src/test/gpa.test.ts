import { describe, expect, it } from "vitest";
import { computeGpa, gradeFor, rowTotal } from "@/lib/gpa";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

describe("GPA calculator", () => {
  it("adds midterm, coursework and final into a total out of 100", () => {
    expect(rowTotal({ midterm: 18, coursework: 17, final: 55 })).toBe(90);
  });

  it("caps each component at its maximum (20/20/60)", () => {
    expect(rowTotal({ midterm: 25, coursework: 30, final: 80 })).toBe(100);
  });

  it("gives 4.0 for 90+, and F below 50", () => {
    expect(gradeFor(90).points).toBe(4);
    expect(gradeFor(49).letter).toBe("F");
    expect(gradeFor(50).points).toBe(2);
  });

  it("weights subject points by credit hours", () => {
    const { gpa, hours } = computeGpa([
      { id: "a", name: "GIS", hours: 3, midterm: 20, coursework: 20, final: 55 }, // 95 -> 4.0
      { id: "b", name: "Prog", hours: 2, midterm: 15, coursework: 15, final: 45 }, // 75 -> 3.0
    ]);
    expect(hours).toBe(5);
    expect(gpa).toBe(3.6);
  });
});

describe("phone login", () => {
  it("normalizes Egyptian numbers including Arabic digits and +20", () => {
    expect(normalizePhone("+20 101 234 5678")).toBe("01012345678");
    expect(normalizePhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(phoneToEmail("010-1234-5678")).toBe("01012345678@mavia.app");
  });
});
