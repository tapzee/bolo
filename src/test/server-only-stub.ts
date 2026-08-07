/**
 * No-op stand-in for the `server-only` package under Vitest.
 *
 * `server-only` ships a browser entry that throws on import, and Vite resolves
 * the browser condition by default — so importing any server module in a test
 * fails before a single assertion runs. Aliasing it here (see
 * `vitest.config.mts`) keeps the real guard active in the Next build, where it
 * genuinely protects against leaking the API key into a client bundle, while
 * letting the same modules be unit-tested in Node.
 */
export {};
