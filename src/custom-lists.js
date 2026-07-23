/* Worker KV database format
key: user:{uid}
value: {"allowlist": ["example.com"], "denylist": ["ads.example.com"]}
*/

import * as dnsutil from "../../commons/dnsutil.js";

function kv() {
    return globalThis.wenv?.CUSTOM_LISTS || null;
}

export async function loadLists(uid) {
    if (!uid) {
        return { allowlist: new Set(), denylist: new Set()};
    }
    const store = kv();

    // no binding — return empty lists / 503 on API
    if (!store) {
        return { allowlist: new Set(), denylist: new Set()};
    }
    
    const rawInfo = await store.get(`user:${uid}`)
    if (!raw) {
        return { allowlist: new Set(), denylist: new Set()};
    }

    const obj = JSON.parse(raw);
    return {
        allowlist: new Set((obj.allowlist || []).map(dnsutil.normalizeName)),
        denylist: new Set((obj.denylist || [])).map(dnsutil.normalizeName),
    }
}
