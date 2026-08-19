import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "@/components/auth/AuthButton";
import { ThemeToggle } from "@/components/theme-toggle";

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center transition-transform hover:scale-[1.02]">
      <div className="relative h-8 w-32 transition-transform group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="CutXflow"
          fill
          sizes="128px"
          className="object-contain object-left dark:hidden"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt="CutXflow"
          fill
          sizes="128px"
          className="hidden object-contain object-left dark:block"
          priority
        />
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
