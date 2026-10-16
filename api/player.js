// Cloud saves for Brain Rush players.
// One private blob per player, keyed by a hash of the normalised name.
// Players log in with name + 4-digit PIN; after that the client keeps a token
// (an HMAC of the name and PIN hash) so it can save without asking again.
import { put, get, del } from '@vercel/blob';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const ORIGINS = ['https://layrayson.github.io', 'http://localhost:4175'];
const SECRET = process.env.TOKEN_SECRET;
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000, MAX_BYTES = 300_000;

const norm = n => String(n || '').trim().replace(/\s+/g, ' ').toLowerCase();
const pathFor = n => `players/${createHash('sha256').update(n).digest('hex')}.json`;
const hashPin = (pin, salt) => scryptSync(pin, salt, 32).toString('hex');
const tokenFor = rec => createHmac('sha256', SECRET).update(`${norm(rec.name)}:${rec.pinHash}`).digest('hex');
const same = (a, b) => { const A = Buffer.from(String(a)), B = Buffer.from(String(b)); return A.length === B.length && timingSafeEqual(A, B); };

async function read(path) {
  const r = await get(path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
const write = (path, rec) => put(path, JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!SECRET) return res.status(500).json({ error: 'The save server is not set up yet.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Bad request.' }); } }
  const { action, name, pin, token, data } = body || {};
  const n = norm(name);
  if (!/^[a-z0-9 ]{2,16}$/.test(n)) return res.status(400).json({ error: 'Names use letters, numbers and spaces, 2 to 16 characters.' });
  if (data !== undefined && JSON.stringify(data).length > MAX_BYTES) return res.status(413).json({ error: 'Save is too large.' });
  const path = pathFor(n);

  try {
    if (action === 'register') {
      if (!/^\d{4}$/.test(String(pin))) return res.status(400).json({ error: 'The PIN must be 4 digits.' });
      if (await read(path)) return res.status(409).json({ error: 'That name is already taken. Try adding a number, like Amaka2.' });
      const salt = randomBytes(16).toString('hex'), now = Date.now();
      const rec = { name: String(name).trim().replace(/\s+/g, ' '), salt, pinHash: hashPin(String(pin), salt), fails: 0, lockUntil: 0, created: now, updated: now, data: data ?? null };
      await write(path, rec);
      return res.status(200).json({ token: tokenFor(rec), name: rec.name, updated: rec.updated });
    }

    if (action === 'login') {
      const rec = await read(path);
      if (!rec) return res.status(404).json({ error: 'No player with that name. Check the spelling.' });
      if (rec.lockUntil > Date.now()) return res.status(429).json({ error: `Too many wrong PINs. Try again in ${Math.ceil((rec.lockUntil - Date.now()) / 60000)} minutes.` });
      if (!/^\d{4}$/.test(String(pin)) || !same(hashPin(String(pin), rec.salt), rec.pinHash)) {
        rec.fails = (rec.fails || 0) + 1;
        const locked = rec.fails >= MAX_FAILS;
        if (locked) { rec.lockUntil = Date.now() + LOCK_MS; rec.fails = 0; }
        await write(path, rec);
        return res.status(locked ? 429 : 401).json({ error: locked ? 'Too many wrong PINs. Try again in 15 minutes.' : `Wrong PIN. ${MAX_FAILS - rec.fails} ${MAX_FAILS - rec.fails === 1 ? 'try' : 'tries'} left.` });
      }
      if (rec.fails) { rec.fails = 0; await write(path, rec); }
      return res.status(200).json({ token: tokenFor(rec), name: rec.name, data: rec.data, updated: rec.updated });
    }

    if (action === 'load' || action === 'save' || action === 'delete') {
      const rec = await read(path);
      if (!rec) return res.status(404).json({ error: 'This player is no longer saved online.' });
      if (!token || !same(token, tokenFor(rec))) return res.status(401).json({ error: 'Please log in again with your PIN.' });
      if (action === 'load') return res.status(200).json({ name: rec.name, data: rec.data, updated: rec.updated });
      if (action === 'delete') { await del(path); return res.status(200).json({ ok: true }); }
      rec.data = data ?? null; rec.updated = Date.now();
      await write(path, rec);
      return res.status(200).json({ updated: rec.updated });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'The save server had a problem. Try again in a moment.' });
  }
}
