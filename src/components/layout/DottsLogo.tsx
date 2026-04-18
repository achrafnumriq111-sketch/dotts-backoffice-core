export function DottsLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <span className="grid grid-cols-2 gap-[3px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        </span>
      </div>
      <span className="text-base font-semibold tracking-tight text-foreground">dotts</span>
    </div>
  );
}
