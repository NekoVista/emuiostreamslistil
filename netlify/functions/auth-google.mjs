import { GOOGLE_ID, signToken, cookie, users, json } from '../lib/site.mjs';
import { verifyGoogleIdToken } from '../lib/google.mjs';

// מקבל את ה-ID token מ"התחבר עם Google", מאמת אותו, שומר את המשתמש ופותח התחברות
export default async (req) => {
  if (req.method !== 'POST') return json({error: 'method'}, 405);
  let credential = '';
  try { credential = (await req.json()).credential; } catch (_) {}
  let c;
  try { c = await verifyGoogleIdToken(credential, GOOGLE_ID()); }
  catch (e) { return json({error: e.message}, 401); }

  const id = String(c.sub), name = String(c.name || c.given_name || 'משתמש'), pic = c.picture || '';
  // נשמרים רק מזהה, שם וזמני כניסה. אין שמירה של אימייל.
  try {
    const store = users(), now = Date.now();
    let prev = null;
    try { prev = await store.get(id, {type: 'json'}); } catch (_) {}
    await store.setJSON(id, {id, name, first: prev?.first || now, last: now, logins: (prev?.logins || 0) + 1});
  } catch (e) { return json({error: 'store'}, 500); }

  const sess = signToken({id, name, pic, exp: Date.now() + 30 * 86400e3});
  return json({ok: true, user: {id, name, pic}}, 200, {'Set-Cookie': cookie('site_sess', sess, {maxAge: 30 * 86400})});
};
export const config = { path: '/api/auth/google' };
