/**
 * Bench: PUT ~1000 custom list domains via /custom
 *
 * Usage (with ./run w already up):
 *   node test/manual/bench-custom-lists.mjs
 *   node test/manual/bench-custom-lists.mjs http://127.0.0.1:8787 benchuser
 */

const BASE = process.argv[2] || "http://127.0.0.1:8787";
const UID = process.argv[3] || "benchuser";
const N = 1000;

function makeDomains(prefix, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`${prefix}-${i}.example.com`);
  }
  return out;
}

async function putLists(allowlist, denylist) {
  const url = `${BASE}/custom?uid=${encodeURIComponent(UID)}`;
  const body = JSON.stringify({ allowlist, denylist });
  const t0 = performance.now();
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  const ms = performance.now() - t0;
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return {
    status: res.status,
    ms,
    bytes: body.length,
    allow: json?.allowlist?.length ?? null,
    deny: json?.denylist?.length ?? null,
    err: json?.error,
  };
}

async function getLists() {
  const url = `${BASE}/custom?uid=${encodeURIComponent(UID)}`;
  const t0 = performance.now();
  const res = await fetch(url);
  const json = await res.json();
  const ms = performance.now() - t0;
  return {
    status: res.status,
    ms,
    allow: json.allowlist?.length ?? 0,
    deny: json.denylist?.length ?? 0,
  };
}

function print(label, r) {
  console.log(
    `${label}: status=${r.status} time=${r.ms.toFixed(1)}ms` +
      (r.bytes != null ? ` reqBytes=${r.bytes}` : "") +
      (r.allow != null ? ` allow=${r.allow}` : "") +
      (r.deny != null ? ` deny=${r.deny}` : "") +
      (r.err ? ` error=${r.err}` : "")
  );
}

const ITERS = Number(process.argv[4]) || 10;
function median(xs) {
  const a = [...xs].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function summary(label, times) {
  const min = Math.min(...times);
  const max = Math.max(...times);
  const med = median(times);
  console.log(
    `${label}: n=${times.length} min=${min.toFixed(1)}ms ` +
      `median=${med.toFixed(1)}ms max=${max.toFixed(1)}ms ` +
      `all=[${times.map((t) => t.toFixed(1)).join(", ")}]`
  );
}
async function bench(label, fn) {
  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const r = await fn();
    if (r.status !== 200) {
      console.error(`${label} iter ${i} failed`, r);
      process.exit(1);
    }
    times.push(r.ms);
  }
  summary(label, times);
}
const denylist = makeDomains("deny", N);
const allowlist = makeDomains("allow", N);
console.log(`base=${BASE} uid=${UID} N=${N} iters=${ITERS}`);
// warmup (not counted)
print("warmup GET", await getLists());
print("warmup PUT", await putLists(allowlist, denylist));
await bench("PUT deny-only", () => putLists([], denylist));
await bench("PUT allow-only", () => putLists(allowlist, []));
await bench("PUT both", () => putLists(allowlist, denylist));
await bench("GET", () => getLists());
