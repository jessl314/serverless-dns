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

const denylist = makeDomains("deny", N);
const allowlist = makeDomains("allow", N);

console.log(`base=${BASE} uid=${UID} N=${N}`);

// warmup
print("warmup GET", await getLists());

print("PUT deny-only (1000)", await putLists([], denylist));
print("GET after deny", await getLists());

print("PUT allow-only (1000)", await putLists(allowlist, []));
print("GET after allow", await getLists());

print("PUT both (1000+1000)", await putLists(allowlist, denylist));
print("GET after both", await getLists());