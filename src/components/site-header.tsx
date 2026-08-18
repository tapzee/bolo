import Image from "next/image";
import { AuthButton } from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/theme-toggle";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-7 overflow-hidden rounded-lg shadow-sm border border-emerald-500/30">
        <Image
          src="/logo.png"
          alt="Bolo AI Logo"
          fill
          sizes="28px"
          className="object-cover"
          priority
        />
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
