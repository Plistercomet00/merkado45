type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { merkado: string; emporio: string; num: string }> = {
  sm: { merkado: "text-lg", emporio: "text-xs", num: "text-2xl" },
  md: { merkado: "text-2xl", emporio: "text-sm", num: "text-4xl" },
  lg: { merkado: "text-4xl", emporio: "text-base", num: "text-6xl" },
};

export function Logo({ size = "md" }: { size?: Size }) {
  const s = SIZES[size];
  return (
    <span className="inline-flex items-baseline gap-1 font-sans leading-none text-primary">
      <span className={`${s.merkado} font-extrabold tracking-tight`}>
        Merkado
      </span>
      <span
        className={`${s.emporio} italic font-serif text-accent-foreground/80`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        empório
      </span>
      <span className={`${s.num} font-black text-accent`}>45</span>
    </span>
  );
}