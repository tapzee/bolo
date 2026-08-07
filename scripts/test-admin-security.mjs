/**
 * Security check for the admin API.
 *
 * The admin routes can grant credits, so "unauthenticated callers are refused"
 * is not something to assume — it is the one property worth proving. Every
 * request below is one an attacker could send from a terminal.
 *
 *   npm run build && npm run start
 *   node scripts/test-admin-security.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:3111";

let ok = true;
const check = (label, pass, detail = "") => {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) ok = false;
};

const post = (url, body, headers = {}) =>
  fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

console.log("admin API security:");

// 1. No token at all.
{
  const r = await fetch(`${BASE}/api/admin/overview`);
  check("GET /overview without a token is refused", r.status === 404, `got ${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/admin/users`);
  check("GET /users without a token is refused", r.status === 404, `got ${r.status}`);
}

// 2. The one that actually matters: granting yourself credits.
{
  const r = await post("/api/admin/users", {
    uid: "victim",
    creditsDelta: 99999,
    reason: "unauthenticated attempt",
  });
  check(
    "POST /users (grant credits) without a token is refused",
    r.status === 404,
    `got ${r.status}`,
  );
}

// 3. A forged bearer token.
{
  const r = await post(
    "/api/admin/users",
    { uid: "victim", creditsDelta: 99999 },
    { Authorization: "Bearer not-a-real-token" },
  );
  check("POST /users with a forged token is refused", r.status === 404, `got ${r.status}`);
}

// 4. A structurally valid but unsigned JWT — the classic bypass attempt.
{
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const fake = `${b64({ alg: "none", typ: "JWT" })}.${b64({
    sub: "attacker",
    email: "jayant.kgp81@gmail.com",
    email_verified: true,
  })}.`;
  const r = await post(
    "/api/admin/users",
    { uid: "victim", creditsDelta: 99999 },
    { Authorization: `Bearer ${fake}` },
  );
  check(
    "POST /users with an unsigned JWT claiming an admin email is refused",
    r.status === 404,
    `got ${r.status}`,
  );
}

// 5. The response must not leak whether the route exists or who admins are.
{
  const r = await fetch(`${BASE}/api/admin/overview`);
  const text = await r.text();
  const leaks = /admin|elevenlabs|@/i.test(text);
  check("refusal body leaks nothing", !leaks, leaks ? text.slice(0, 120) : "");
}

console.log("");
console.log(ok ? "ALL SECURITY CHECKS PASSED" : "SECURITY CHECKS FAILED");
process.exit(ok ? 0 : 1);
