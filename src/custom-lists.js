/* Worker KV database format
key: user:{uid}
value: {
  "allowlist": ["example.com"],
  "denylist": ["ads.example.com"],
  "passwordHash": "...",
  "passwordSalt": "..."
}
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
    const empty = {
      allowlist: new Set(),
      denylist: new Set(),
    };

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

export async function loadAuth(uid) {
  const store = kv();

  if (!store || !uid) {
    return {
      passwordHash: "",
      passwordSalt: "",
    };
  }

  const rawInfo = await store.get(`user:${uid}`);

  if (!rawInfo) {
    return {
      passwordHash: "",
      passwordSalt: "",
    };
  }

  const obj = JSON.parse(rawInfo);

  return {
    passwordHash: obj.passwordHash || "",
    passwordSalt: obj.passwordSalt || "",
  };
}

export async function hasAuth(uid) {
  const auth = await loadAuth(uid);
  return Boolean(auth.passwordHash);
}

export async function saveAuth(uid, { passwordHash, passwordSalt }) {
  const store = kv();

  if (!store) {
    throw new Error("CUSTOM_LISTS KV binding not configured");
  }

  const rawInfo = await store.get(`user:${uid}`);

  let existing = {};

  if (rawInfo) {
    existing = JSON.parse(rawInfo);
  }

  const updated = {
    ...existing,
    passwordHash,
    passwordSalt,
  };

  await store.put(`user:${uid}`, JSON.stringify(updated));

  return {
    passwordHash,
    passwordSalt,
  };
}

export async function saveLists(uid, { allowlist, denylist }) {
  const store = kv();

  if (!store) {
    throw new Error("CUSTOM_LISTS KV binding not configured");
  }

  const rawInfo = await store.get(`user:${uid}`);

  let existing = {};

  if (rawInfo) {
    existing = JSON.parse(rawInfo);
  }

  const normalized = {
    ...existing,
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
