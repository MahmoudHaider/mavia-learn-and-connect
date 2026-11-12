/**
 * Official wording for the "what is MAVIA?" question.
 * Kept verbatim so the assistant never rephrases it and never misspells it.
 */
export const INTRO_ANSWER_AR =
  "منصة ماڤيا منصة شاملة كل حاجة: من حيث المواد بتاعتك بملخصاتها وبامتحاناتها بكل حاجة + إني عملتلك خانة خاصة بالكورسات عشان تتطور نفسك وتبقى مميز.";

export const INTRO_ANSWER_EN =
  "MAVIA is an all-in-one platform for everything: your subjects with their summaries and exams, everything you need + I made you a special Courses section so you can develop yourself and stand out.";

const DIACRITICS_AND_TATWEEL = /[\u064B-\u0652\u0670\u0640]/g;

/** Lowercases, drops diacritics/hamza variants/punctuation so typing style doesn't matter. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(DIACRITICS_AND_TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ڤ/g, "ف")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Brand or the word "platform" in either language. */
const PLATFORM_TOKEN = /(mavia|مافيا|(?:ال)?منص[هة]|platform)/;

/** Asks for a definition, not for a how-to. */
const DEFINITION_MARKER: RegExp[] = [
  /(?:^|\s)(?:ايه|what|whats|define|يعني|عرف|عرفني|مين|هيه|tell)(?:\s|$)/,
  /(?:^|\s)اي\s+هي(?:\s|$)/,
  /(?:^|\s)ما\s+هي(?:\s|$)/,
];

/** True for "ايه هي المنصة؟" / "What is MAVIA?" style questions. */
export function isPlatformIntroQuestion(text: string): boolean {
  const q = normalizeQuestion(text);
  if (!q || !PLATFORM_TOKEN.test(q)) return false;
  return DEFINITION_MARKER.some((re) => re.test(q));
}
