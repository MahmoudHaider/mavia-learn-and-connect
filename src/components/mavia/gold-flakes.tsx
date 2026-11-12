import type { CSSProperties } from "react";

// Fixed positions so server and client render the same markup.
const FLAKES = [
  { left: 6, size: 7, dur: 16, delay: 0, drift: 40 },
  { left: 14, size: 5, dur: 19, delay: 4, drift: -30 },
  { left: 23, size: 9, dur: 14, delay: 8, drift: 50 },
  { left: 31, size: 4, dur: 21, delay: 2, drift: 20 },
  { left: 40, size: 6, dur: 17, delay: 11, drift: -45 },
  { left: 48, size: 8, dur: 15, delay: 6, drift: 30 },
  { left: 57, size: 5, dur: 20, delay: 1, drift: -20 },
  { left: 65, size: 10, dur: 13, delay: 9, drift: 60 },
  { left: 72, size: 6, dur: 18, delay: 3, drift: -35 },
  { left: 80, size: 4, dur: 22, delay: 7, drift: 25 },
  { left: 88, size: 8, dur: 16, delay: 12, drift: -50 },
  { left: 95, size: 5, dur: 19, delay: 5, drift: 15 },
];

export function GoldFlakes({ count = FLAKES.length }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.slice(0, count).map((f, i) => (
        <span
          key={i}
          className="flake"
          style={
            {
              left: `${f.left}%`,
              "--size": `${f.size}px`,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
              "--drift": `${f.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
