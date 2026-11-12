import { Button } from "@/components/ui/button";
import { ACADEMIC_YEARS } from "@/lib/phone";

export function YearChips({
  value,
  onChange,
  includeAll = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  includeAll?: boolean;
}) {
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
          كل الفرق
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
          {y.label}
        </Button>
      ))}
    </div>
  );
}
