import { cookies, verifyToken, json, GOOGLE_ID } from '../lib/site.mjs';

export default async (req) => {
  const s = verifyToken(cookies(req).site_sess);
  return json({user: s ? {id: s.id, name: s.name, pic: s.pic} : null, googleClientId: GOOGLE_ID() || null});
};
export const config = { path: '/api/me' };
