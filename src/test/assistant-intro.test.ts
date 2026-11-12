import { describe, expect, it } from "vitest";

import {
  INTRO_ANSWER_AR,
  INTRO_ANSWER_EN,
  isPlatformIntroQuestion,
  normalizeQuestion,
} from "@/server/ai/canned";

describe("platform intro question detection", () => {
  it("matches the Arabic ways of asking what the platform is", () => {
    for (const q of [
      "اي هي المنصة",
      "إيه هي منصة ماڤيا؟",
      "ايه هي المنصه",
      "ما هي ماڤيا",
      "مافيا ايه",
      "عرفني المنصة",
      "المنصة يعني ايه",
    ]) {
      expect(isPlatformIntroQuestion(q)).toBe(true);
    }
  });

  it("matches the English ways of asking what the platform is", () => {
    for (const q of ["What is MAVIA?", "what is the platform", "tell me about mavia", "define MAVIA"]) {
      expect(isPlatformIntroQuestion(q)).toBe(true);
    }
  });

  it("does not match other platform questions", () => {
    for (const q of [
      "إزاي أحسب الـ GPA بتاعي؟",
      "لوحة التصدر بتتحسب إزاي؟",
      "أبدأ أتعلم GIS منين؟",
      "ازاي اعمل حساب",
      "اي مادة في المنصة صعبة",
    ]) {
      expect(isPlatformIntroQuestion(q)).toBe(false);
    }
  });
});

describe("official intro wording", () => {
  it("keeps the brand name and the courses promise in both languages", () => {
    expect(INTRO_ANSWER_AR).toContain("منصة ماڤيا");
    expect(INTRO_ANSWER_AR).toContain("بملخصاتها");
    expect(INTRO_ANSWER_AR).toContain("وبامتحاناتها");
    expect(INTRO_ANSWER_AR).toContain("الكورسات");
    expect(INTRO_ANSWER_EN).toContain("MAVIA");
    expect(INTRO_ANSWER_EN).toContain("Courses");
  });

  it("has no glued words or hamza-less spellings in the Arabic answer", () => {
    expect(INTRO_ANSWER_AR).not.toMatch(/منصةم/);
    expect(INTRO_ANSWER_AR).not.toMatch(/(^|\s)اني(\s|$)/);
    expect(INTRO_ANSWER_AR).not.toMatch(/(^|\s)عايز(ن)?\s/);
    expect(normalizeQuestion(INTRO_ANSWER_AR)).toContain("منصة مافيا");
  });
});
