import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const env = n => (process.env[n] || '').trim();

// ה-Client ID של Google (לא סודי). אפשר להגדיר כמשתנה סביבה GOOGLE_CLIENT_ID או להדביק כאן בין המרכאות.
const BUILTIN_GOOGLE_ID = '539376801619-431qi70qcr65boa1gqp85n4ign9kf0m3.apps.googleusercontent.com';
export const GOOGLE_ID = () => env('GOOGLE_CLIENT_ID') || BUILTIN_GOOGLE_ID;

// מפתח לחתימת העוגייה של ההתחברות. מומלץ להגדיר SESSION_SECRET במשתני הסביבה של Netlify.
const SESSION_SECRET = () => env('SESSION_SECRET') || 'aa57534d84d920edee2162298f459e6a12b802481a905a1b45e41963c94b8d1f';

export const b64u = b => Buffer.from(b).toString('base64url');
const sig = p => createHmac('sha256', SESSION_SECRET()).update(p).digest('base64url');
export const signToken = obj => { const p = b64u(JSON.stringify(obj)); return p + '.' + sig(p); };
export function verifyToken(tok) {
  if (!tok || !tok.includes('.')) return null;
  const [p, s] = tok.split('.');
  const a = Buffer.from(s), b = Buffer.from(sig(p));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(p, 'base64url').toString());
    return o.exp && Date.now() > o.exp ? null : o;
  } catch (_) { return null; }
}

export function cookies(req) {
  const out = {};
  (req.headers.get('cookie') || '').split(/;\s*/).forEach(kv => {
    const i = kv.indexOf('=');
    if (i > 0) out[kv.slice(0, i)] = kv.slice(i + 1);
  });
  return out;
}
export const cookie = (name, value, {maxAge = 0, path = '/'} = {}) =>
  `${name}=${value}; Path=${path}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

export const users = () => globalThis.__TEST_STORE__ || getStore('google-users');
export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {status, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra}});
