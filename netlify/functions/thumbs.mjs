import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

// טאמבנילים מותאמים ללייבים, משותפים לכל המבקרים.
// קריאה (GET) פתוחה לכולם. שמירה והסרה (POST) דורשות מפתח מנהל: משתנה הסביבה THUMBS_KEY ב-Netlify.
const store = () => globalThis.__TEST_THUMBS__ || getStore('thumbs');
const KEY = () => (process.env.THUMBS_KEY || '').trim();
const SLUG = /^[a-z0-9_.-]{1,60}$/;
const res = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {status, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra}});
const okKey = k => {
  const a = Buffer.from(String(k || '')), b = Buffer.from(KEY());
  return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
};
const readIndex = async st => { try { return (await st.get('index', {type: 'json'})) || {}; } catch (_) { return {}; } };

export default async (req) => {
  const st = store();
  if (req.method === 'GET') return res({thumbs: await readIndex(st), canWrite: !!KEY()});
  if (req.method !== 'POST') return res({error: 'method'}, 405);
  if (!KEY()) return res({error: 'not_configured'}, 503);

  let b;
  try { b = await req.json(); } catch (_) { return res({error: 'bad'}, 400); }
  if (!okKey(b.key)) return res({error: 'key'}, 401);
  const slug = String(b.slug || '').toLowerCase();
  if (!SLUG.test(slug)) return res({error: 'slug'}, 400);

  const idx = await readIndex(st);
  if (b.remove) {
    delete idx[slug];
    try { await st.delete('img:' + slug); } catch (_) {}
  } else if (typeof b.url === 'string' && b.url) {
    if (!/^https:\/\/[^\s"'<>]{3,500}$/i.test(b.url)) return res({error: 'url'}, 400);
    idx[slug] = {v: Date.now(), url: b.url};
    try { await st.delete('img:' + slug); } catch (_) {}
  } else if (typeof b.image === 'string') {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.image);
    if (!m) return res({error: 'image'}, 400);
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 400 * 1024) return res({error: 'size'}, 413);
    await st.set('img:' + slug, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), {metadata: {contentType: m[1]}});
    idx[slug] = {v: Date.now()};
  } else return res({error: 'bad'}, 400);

  await st.setJSON('index', idx);
  return res({ok: true, v: idx[slug]?.v || 0});
};
export const config = { path: '/api/thumbs' };
