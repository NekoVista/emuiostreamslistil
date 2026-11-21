// Netlify Function: מביא סטרימרים ישראלים מה-API הרשמי של Kick.
// דורש משתני סביבה באתר ב-Netlify: KICK_CLIENT_ID ו-KICK_CLIENT_SECRET
let tok = null, tokExp = 0;
const env = n => (process.env[n] || '').trim();
// מפתחות מובנים (גיבוי כשמשתני הסביבה של Netlify לא מגיעים לפונקציה).
// הקוד של הפונקציה רץ בשרת ולא נשלח לגולשים, אבל אל תעלה את הקובץ הזה ל-Git ציבורי.
const BUILTIN_ID = '01M7SY5KEF4ABZS4NDYSTK19EC';
const BUILTIN_SECRET = '91d53a28b776dce7c5e0c87ebc26d930a863a240b07594ee5818874de57407d5';
const CID = () => env('KICK_CLIENT_ID') || env('CLIENT_ID') || BUILTIN_ID;
const CSEC = () => env('KICK_CLIENT_SECRET') || env('CLIENT_SECRET') || BUILTIN_SECRET;
const HEB = /[\u0590-\u05FF]/;

function isHeb(x) {
  const ch = x.channel || {};
  const lang = String(x.language || x.lang || ch.language || '').toLowerCase();
  if (lang) return ['he', 'heb', 'iw', 'hebrew'].includes(lang);
  const text = [x.session_title, x.stream_title, x.title, ch.user && ch.user.username, ch.slug, x.slug].join(' ');
  return HEB.test(text);
}

async function appToken() {
  if (tok && Date.now() < tokExp) return tok;
  const r = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CID(),
      client_secret: CSEC()
    })
  });
  const txt = await r.text();
  if (!r.ok) throw new Error('token HTTP ' + r.status + ' ' + txt.slice(0, 200));
  const j = JSON.parse(txt);
  tok = j.access_token; tokExp = Date.now() + ((j.expires_in || 3600) - 60) * 1000;
  return tok;
}

async function page(t, qs) {
  const r = await fetch('https://api.kick.com/public/v1/livestreams?' + qs, {
    headers: {Authorization: 'Bearer ' + t, Accept: 'application/json'}
  });
  const txt = await r.text();
  if (!r.ok) throw new Error('livestreams HTTP ' + r.status + ' ' + txt.slice(0, 200));
  return JSON.parse(txt).data || [];
}

exports.handler = async () => {
  const headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store'};
  try {
    if (!CID() || !CSEC()) {
      const seen = Object.keys(process.env).filter(k => /KICK|CLIENT/i.test(k));
      throw new Error('חסרים KICK_CLIENT_ID / KICK_CLIENT_SECRET בפונקציה. משתנים דומים שהפונקציה רואה: ' + (seen.join(', ') || 'אין'));
    }
    const t = await appToken();
    let d;
    try { d = await page(t, 'language=he&sort=viewer_count&limit=100'); }
    catch (e) { d = await page(t, 'sort=viewer_count&limit=100'); }
    return {statusCode: 200, headers, body: JSON.stringify({data: d.filter(isHeb)})};
  } catch (e) {
    return {statusCode: 502, headers, body: JSON.stringify({error: e.message})};
  }
};
