import { getStore } from '@netlify/blobs';

// מחזיר את תמונת הטאמבנייל ששמורה לסטרימר: /api/thumb?slug=name
const SLUG = /^[a-z0-9_.-]{1,60}$/;
export default async (req) => {
  const slug = (new URL(req.url).searchParams.get('slug') || '').toLowerCase();
  if (!SLUG.test(slug)) return new Response('bad slug', {status: 400});
  const st = globalThis.__TEST_THUMBS__ || getStore('thumbs');
  let r = null;
  try { r = await st.getWithMetadata('img:' + slug, {type: 'arrayBuffer'}); } catch (_) {}
  if (!r || !r.data) return new Response('not found', {status: 404});
  return new Response(r.data, {headers: {
    'Content-Type': r.metadata?.contentType || 'image/jpeg',
    'Cache-Control': 'public, max-age=31536000, immutable'
  }});
};
export const config = { path: '/api/thumb' };
