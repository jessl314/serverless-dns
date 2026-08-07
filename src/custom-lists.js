/* Worker KV database format
key: user:{uid}
value: {"allowlist": ["example.com"], "denylist": ["ads.example.com"]}
*/

import * as dnsutil from "./commons/dnsutil.js";
import { UserCache } from "./plugins/users/user-cache.js";

const listCache = new UserCache(200);

function kv() {
  return globalThis.wenv?.CUSTOM_LISTS || null;
}

export async function loadLists(uid) {
  if (!uid) {
    return { allowlist: new Set(), denylist: new Set() };
  }
  const store = kv();

  // no binding — return empty lists / 503 on API
  if (!store) {
    return { allowlist: new Set(), denylist: new Set() };
  }

  const cached = listCache.get(uid);
  if (cached) {
    return cached; // LFU cache hit
  }

  // LFU cache miss -> go to KV database
  const rawInfo = await store.get(`user:${uid}`);

  // KV database miss
  if (!rawInfo) {
    const empty = { allowlist: new Set(), denylist: new Set() };
    listCache.put(uid, empty);
    return empty;
  }

  const obj = JSON.parse(rawInfo);

  const lists = {
    allowlist: new Set((obj.allowlist || []).map(dnsutil.normalizeName)),
    denylist: new Set((obj.denylist || []).map(dnsutil.normalizeName)),
  };
  listCache.put(uid, lists);
  return lists;
}

export async function saveLists(uid, { allowlist, denylist }) {
  const store = kv();
  if (!store) {
    throw new Error("CUSTOM_LISTS KV binding not configured");
  }

  const normalized = {
    allowlist: (allowlist || []).map(dnsutil.normalizeName),
    denylist: (denylist || []).map(dnsutil.normalizeName),
  };
  await store.put(`user:${uid}`, JSON.stringify(normalized));

  const lists = {
    allowlist: new Set(normalized.allowlist),
    denylist: new Set(normalized.denylist),
  };
  listCache.put(uid, lists);
  return lists;
}
