/**
 * Proves /api/transcribe refuses unauthenticated callers.
 *
 * The UI gate is only UX — anyone can POST straight at this route, and every
 * call costs real money at ElevenLabs. This is the check that matters.
 *
 *   npm run build && npm run start
 *   node scripts/test-transcribe-auth.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:3111";

let ok = true;
const check = (label, pass, detail = "") => {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) ok = false;
};

// A tiny but structurally valid WAV, so a rejection cannot be blamed on the file.
const wav = () => {
  const samples = 16000;
  const bytes = samples * 2;
  const b = Buffer.alloc(44 + bytes);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + bytes, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24);
  b.writeUInt32LE(32000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(bytes, 40);
  return b;
};

const send = (headers = {}) => {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(wav())], { type: "audio/wav" }), "a.wav");
  form.append("language_code", "hi");
  form.append("duration_seconds", "1");
  return fetch(`${BASE}/api/transcribe`, { method: "POST", body: form, headers });
};

console.log("transcribe auth:");

{
  const r = await send();
  const body = await r.json().catch(() => ({}));
  check("no token is rejected with 401", r.status === 401, `got ${r.status}`);
  check(
    "rejection code is 'unauthorized'",
    body.code === "unauthorized",
    String(body.code),
  );
  check(
    "message tells the user what to do",
    typeof body.message === "string" && /sign in/i.test(body.message),
    body.message,
  );
}

{
  const r = await send({ Authorization: "Bearer garbage" });
  check("forged token is rejected", r.status === 401, `got ${r.status}`);
}

{
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "none", typ: "JWT" })}.${b64({
    sub: "attacker",
    user_id: "attacker",
    email: "attacker@example.com",
  })}.`;
  const r = await send({ Authorization: `Bearer ${unsigned}` });
  check("unsigned JWT is rejected", r.status === 401, `got ${r.status}`);
}

console.log("");
console.log(ok ? "ALL AUTH CHECKS PASSED" : "AUTH CHECKS FAILED");
process.exit(ok ? 0 : 1);
