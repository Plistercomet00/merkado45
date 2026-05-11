type Size = "sm" | "md" | "lg";
type Variant = "default" | "onDark";

const SIZES: Record<Size, { merkado: string; emporio: string; num: string }> = {
  sm: { merkado: "text-lg", emporio: "text-xs", num: "text-2xl" },
  md: { merkado: "text-2xl", emporio: "text-sm", num: "text-4xl" },
  lg: { merkado: "text-4xl", emporio: "text-base", num: "text-6xl" },
};

export function Logo({
  size = "md",
  variant = "default",
}: {
  size?: Size;
  variant?: Variant;
}) {
  const s = SIZES[size];
  const onDark = variant === "onDark";
  return (
    <span
      className={`inline-flex items-baseline gap-1 font-sans leading-none ${
        onDark ? "text-white" : "text-primary"
      }`}
    >
      <span className={`${s.merkado} font-extrabold tracking-tight`}>
        Merkado
      </span>
      <span
        className={`${s.emporio} italic ${onDark ? "text-white/90" : "text-secondary"}`}
        style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
      >
        empório
      </span>
      <span className={`${s.num} font-black ${onDark ? "text-primary" : "text-accent"}`}>
        45
      </span>
    </span>
  );
}