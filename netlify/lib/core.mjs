import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KINDS = ["Rental License", "Property Registration", "Permit"];
const LIMITS = { kind: 40, status: 60, address: 200, number: 120, entity: 200, ptype: 60, issued: 10, expires: 10, link: 500, notes: 4000 };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_BODY = 400000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function cleanItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "");
  if (!ID.test(id)) return null;
  const out = { id };
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = raw[k] == null ? "" : String(raw[k]).trim();
    if (v.length > max) return null;
    out[k] = v;
  }
  if (!KINDS.includes(out.kind)) return null;
  if (!out.address) return null;
  if (out.issued && !DATE.test(out.issued)) return null;
  if (out.expires && !DATE.test(out.expires)) return null;
  if (out.link && !/^https?:\/\//i.test(out.link)) out.link = "";
  if (out.kind !== "Permit") out.ptype = "";
  return out;
}

async function hashPass(pass, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : randomBytes(16);
  const hash = await scryptAsync(pass, salt, 32);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

async function verifyPass(pass, auth) {
  if (typeof pass !== "string" || !pass || !auth) return false;
  const { hash } = await hashPass(pass, auth.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(auth.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readAll(store) {
  const { blobs } = await store.list({ prefix: "item_" });
  const rows = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return rows.filter(Boolean);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handle(req, store) {
  const auth = await store.get("auth", { type: "json" });

  if (req.method === "GET") {
    return json({ configured: !!auth, items: await readAll(store), now: Date.now() });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: "too_large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad_json" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "bad_json" }, 400);
  const op = body.op;

  if (op === "setup") {
    if (auth) return json({ error: "already_configured" }, 409);
    const pass = body.pass;
    if (typeof pass !== "string" || pass.length < 8 || pass.length > 200) return json({ error: "weak_passphrase" }, 400);
    const rec = await hashPass(pass);
    await store.setJSON("auth", { ...rec, updatedAt: Date.now() });
    let seeded = 0;
    if (Array.isArray(body.seed) && body.seed.length <= 200) {
      const existing = await readAll(store);
      if (!existing.length) {
        for (const raw of body.seed) {
          const it = cleanItem(raw);
          if (it) { it.updatedAt = Date.now(); await store.setJSON("item_" + it.id, it); seeded++; }
        }
      }
    }
    return json({ ok: true, seeded });
  }

  if (!auth) return json({ error: "not_configured" }, 409);
  const pass = req.headers.get("x-hub-pass");
  if (!(await verifyPass(pass, auth))) { await wait(400); return json({ error: "unauthorized" }, 401); }

  if (op === "check") return json({ ok: true });

  if (op === "upsert") {
    const it = cleanItem(body.item);
    if (!it) return json({ error: "invalid_item" }, 400);
    it.updatedAt = Date.now();
    await store.setJSON("item_" + it.id, it);
    return json({ ok: true, item: it });
  }

  if (op === "delete") {
    const id = String(body.id || "");
    if (!ID.test(id)) return json({ error: "invalid_id" }, 400);
    await store.delete("item_" + id);
    return json({ ok: true });
  }

  if (op === "changepass") {
    const np = body.newPass;
    if (typeof np !== "string" || np.length < 8 || np.length > 200) return json({ error: "weak_passphrase" }, 400);
    const rec = await hashPass(np);
    await store.setJSON("auth", { ...rec, updatedAt: Date.now() });
    return json({ ok: true });
  }

  return json({ error: "unknown_op" }, 400);
}
