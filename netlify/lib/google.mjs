import { createPublicKey, verify } from 'node:crypto';

let jwks = null, jwksAt = 0;
async function keys(fetchImpl) {
  if (jwks && Date.now() - jwksAt < 3600e3) return jwks;
  const r = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw new Error('certs_' + r.status);
  jwks = (await r.json()).keys || []; jwksAt = Date.now();
  return jwks;
}

// בודק ID token של Google: חתימה (RS256), מנפיק, קהל (ה-Client ID שלך) ותוקף.
export async function verifyGoogleIdToken(token, clientId, fetchImpl = fetch) {
  if (!clientId) throw new Error('no_client_id');
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('bad_token');
  const [h, p, s] = parts;
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  if (header.alg !== 'RS256') throw new Error('bad_alg');
  const jwk = (await keys(fetchImpl)).find(k => k.kid === header.kid);
  if (!jwk) throw new Error('unknown_key');
  const ok = verify('RSA-SHA256', Buffer.from(h + '.' + p), createPublicKey({key: jwk, format: 'jwk'}), Buffer.from(s, 'base64url'));
  if (!ok) throw new Error('bad_signature');
  const c = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(c.iss)) throw new Error('bad_issuer');
  if (c.aud !== clientId) throw new Error('bad_audience');
  if (!c.exp || c.exp * 1000 < Date.now()) throw new Error('expired');
  if (!c.sub) throw new Error('no_sub');
  return c;
}
