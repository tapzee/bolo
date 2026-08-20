import type { ReactNode } from "react";
import { AppSidebar, MobileTopBar } from "./AppSidebar";

/**
 * Layout for signed-in app surfaces (create, projects, settings…).
 *
 * A component rather than a route-group layout so marketing pages can opt out
 * without moving files around — the landing page and legal pages get their own
 * chrome, and mixing the two in one `layout.tsx` would mean conditionals on
 * pathname, which is exactly the pattern that rots.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar />
      <div className="min-w-0 flex-1 flex flex-col">
        <MobileTopBar />
        <div className="flex-1 min-w-0 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
