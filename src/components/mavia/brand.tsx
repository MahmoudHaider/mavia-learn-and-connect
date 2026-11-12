import logo from "@/assets/mavia-official-logo.webp.asset.json";
import { cn } from "@/lib/utils";

/** The official round MAVIA logo. */
export function BrandMark({ className }: { className?: string | undefined }) {
  return (
    <img
      src={logo.url}
      alt=""
      width={800}
      height={800}
      className={cn(
        "h-10 w-10 rounded-full object-cover ring-1 ring-primary/50 shadow-gold-sm",
        className,
      )}
    />
  );
}

export function Brand({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} dir="ltr">
      <BrandMark className={size === "lg" ? "h-16 w-16" : undefined} />
      <div className="leading-none">
        <div
          className={cn(
            "animate-sheen font-latin font-bold tracking-[0.25em]",
            size === "lg" ? "text-3xl" : "text-xl",
          )}
        >
          MAVIA
        </div>
        <div className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Surveying Engineers
        </div>
      </div>
    </div>
  );
}
