/** Students sign in with their phone number; auth needs an email, so we derive one. */
export function normalizePhone(raw: string): string {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const western = raw.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  let digits = western.replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = "0" + digits.slice(2);
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  return d.length >= 10 && d.length <= 15;
}

export function phoneToEmail(raw: string): string {
  return `${normalizePhone(raw)}@mavia.app`;
}

export const ACADEMIC_YEARS = [
  { value: 1, label: "الفرقة الأولى", labelEn: "Year 1" },
  { value: 2, label: "الفرقة الثانية", labelEn: "Year 2" },
  { value: 3, label: "الفرقة الثالثة", labelEn: "Year 3" },
  { value: 4, label: "الفرقة الرابعة", labelEn: "Year 4" },
] as const;

export function yearLabel(year: number | null | undefined, lang: "ar" | "en" = "ar"): string {
  const y = ACADEMIC_YEARS.find((y) => y.value === year);
  if (!y) return lang === "ar" ? "كل الفرق" : "All years";
  return lang === "ar" ? y.label : y.labelEn;
}
