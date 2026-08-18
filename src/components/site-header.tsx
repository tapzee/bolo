import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/theme-toggle";

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
      <div className="relative size-9 overflow-hidden rounded-xl shadow-md border border-brand/30 transition-transform group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="Desi Auto-Caption Logo"
          fill
          sizes="36px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black tracking-tight text-foreground">
          Desi
        </span>
        <span className="text-lg font-medium tracking-tight text-foreground">
          Auto-Caption
        </span>
      </div>
    </Link>
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
