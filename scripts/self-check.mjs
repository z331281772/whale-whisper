// Self-check for the deep-diving native TurnStatus modification.
// Usage: node self-check.mjs [--bundle=<path>]
import { readBundle } from "./paths.mjs";

const { path: F, src } = readBundle();
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures.push(name);
};

// 1. constants
check("DDN_CAPTION_COUNT = 120", /const DDN_CAPTION_COUNT = 120;/.test(src));
check("fallback interval constant", /const DDN_CAPTION_INTERVAL_MS = \d+;/.test(src));

// 2. caption dict rows: exactly 240 (120 zh + 120 en), keys 00..119 each twice
const rows = [...src.matchAll(/"turnStatus\.caption\.(\d{2,3})": "([^"]*)"/g)];
check("240 caption rows", rows.length === 240, `${rows.length}`);
const byKey = new Map();
for (const m of rows) byKey.set(m[1], (byKey.get(m[1]) ?? 0) + 1);
const badKeys = [...byKey.entries()].filter(([, n]) => n !== 2);
check("each key exactly 2 rows (zh+en)", badKeys.length === 0, badKeys.map(([k, n]) => `${k}x${n}`).join(","));
const keys = [...byKey.keys()].map(Number).sort((a, b) => a - b);
check("keys are 00..119 contiguous", keys.length === 120 && keys[0] === 0 && keys[119] === 119, `${keys[0]}..${keys[119]}`);

// 3. no duplicate caption values across the whole dict
const vals = rows.map((m) => m[2]);
const dup = vals.filter((v, i) => vals.indexOf(v) !== i);
check("no duplicate caption values", dup.length === 0, dup.slice(0, 3).join(" | "));

// 4. zh/en alignment: every zh key has an en twin
const zhVals = [];
const enVals = [];
for (const m of rows) {
  const idx = Number(m[1]);
  if (zhVals[idx] === undefined) zhVals[idx] = m[2];
  else enVals[idx] = m[2];
}
const badLang = zhVals.map((z, i) => (enVals[i] ? null : i)).filter((x) => x !== null);
check("every zh key has en twin", badLang.length === 0);

// 5. logic: event-driven switch + tool-pause fallback + random-never-current
check("event-driven switch present", /lastCallIdRef/.test(src) && /calls\[calls\.length - 1\]\.callId/.test(src));
check("random pick excludes current", /next === current \? \(next \+ 1\) % DDN_CAPTION_COUNT : next/.test(src));
check("fallback pauses while tool runs", /calls\.length > 0\) return void 0/.test(src));
check("clock at 15s kept", /elapsedMs >= 15e3/.test(src));

// 6. visuals: bubbles spacing + caption animation + reduced-motion
check("bubble spacing 8px", /margin-right:8px/.test(src));
check("reduced-motion guard", /prefers-reduced-motion: reduce/.test(src));
check("aria-live status", /"aria-live": "polite"/.test(src));

// 7. no leftovers from previous iterations
check("old 'Deep diving...' text gone", !src.includes('"Deep diving..."'));
check("no keys beyond 119", !/turnStatus\.caption\.(12\d|1[3-9]\d)"/.test(src));

console.log(failures.length === 0 ? "\nALL CHECKS PASSED" : `\n${failures.length} FAILURES: ${failures.join(", ")}`);
process.exit(failures.length === 0 ? 0 : 1);
