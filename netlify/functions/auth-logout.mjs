import { cookie } from '../lib/site.mjs';

export default async () => new Response(null, {
  status: 302,
  headers: {Location: '/', 'Set-Cookie': cookie('site_sess', '', {maxAge: 0}), 'Cache-Control': 'no-store'}
});
export const config = { path: '/api/auth/logout' };
