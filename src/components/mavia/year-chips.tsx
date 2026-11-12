import { Button } from "@/components/ui/button";
import { ACADEMIC_YEARS } from "@/lib/phone";
import { useLang } from "@/lib/i18n";

export function YearChips({
  value,
  onChange,
  includeAll = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  includeAll?: boolean;
}) {
  const { tr } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      {includeAll && (
        <Button
          type="button"
          size="sm"
          variant="chip"
          data-active={value === null}
          onClick={() => onChange(null)}
        >
          {tr("كل الفرق", "All years")}
        </Button>
      )}
      {ACADEMIC_YEARS.map((y) => (
        <Button
          key={y.value}
          type="button"
          size="sm"
          variant="chip"
          data-active={value === y.value}
          onClick={() => onChange(y.value)}
        >
          {tr(y.label, y.labelEn)}
        </Button>
      ))}
    </div>
  );
}
