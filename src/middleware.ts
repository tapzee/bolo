import { NextResponse, type NextRequest } from "next/server";

/**
 * Hides the internal QA routes under `/dev` unless they are explicitly enabled.
 *
 * `/dev/frames` and `/dev/billing` are unpolished internal surfaces that render
 * states which are otherwise hard to reach — every caption style at fixed
 * playheads, and the credit wall in each of its shapes. They are genuinely
 * useful and they are not secret, but they are not part of the product, and a
 * public deployment that serves them invites someone to find one and conclude
 * it is a broken feature.
 *
 * Enabled by setting `ENABLE_DEV_ROUTES=1`, which `npm run visual-qa` needs —
 * that script drives `/dev/frames` against a *production* build on port 3111,
 * so gating on `NODE_ENV` alone would break it. Never set this on the Vercel
 * production environment.
 *
 * Rewritten to a path that does not exist rather than answered with a bare 404,
 * so a disabled route is indistinguishable from a route that was never there —
 * including rendering the app's own not-found page.
 */
export function middleware(request: NextRequest) {
  if (process.env.ENABLE_DEV_ROUTES === "1") return NextResponse.next();
  return NextResponse.rewrite(new URL("/_dev-routes-disabled", request.url));
}

// Only `/dev` paths invoke this. Everything else never pays for it.
export const config = {
  matcher: "/dev/:path*",
};
