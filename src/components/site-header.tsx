import { AuthButton } from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/theme-toggle";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex size-7 items-center justify-center rounded-lg bg-brand">
        {/* Speech-bubble tail, drawn rather than an icon so the mark stays
            crisp at any size and needs no extra network request. */}
        <span className="block size-2.5 rounded-[3px] bg-brand-foreground" />
        <span className="absolute -bottom-0.5 left-1.5 size-2 rotate-45 rounded-[2px] bg-brand" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">bolo</span>
    </div>
  );
}

export function SiteHeader({ phase }: { phase: string }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden text-xs text-muted-foreground sm:block">
            {phase}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
