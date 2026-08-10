/**
 * `src/core` — the portable heart of Bolo.
 *
 * Hard rule: nothing in this directory may import from `react`, `next/*`,
 * `remotion`, `firebase` or any other runtime-specific package. It is plain
 * TypeScript over plain data. That constraint is what lets a future PWA shell
 * or a Capacitor/Android build reuse the caption model, timing maths, style
 * registry and credit rules without dragging the web app along.
 *
 * If a helper needs a hook, the DOM or a network client, it belongs in
 * `src/lib` (web) or `src/remotion` (rendering) — not here.
 */

export * from "./captions/types";
export * from "./captions/pages";
export * from "./captions/sample";
export * from "./captions/roles";
export * from "./styles/types";
export * from "./styles/registry";
export * from "./styles/scale";
export * from "./styles/layout";
export * from "./styles/estimate";
export * from "./styles/templates";
export * from "./video/constants";
export * from "./billing/credits";
export * from "./billing/entitlements";
export * from "./billing/ledger";
export * from "./billing/pricing";
export * from "./media/constraints";
export * from "./i18n/languages";
export * from "./i18n/romanize";
export * from "./editor/operations";
export * from "./editor/history";
