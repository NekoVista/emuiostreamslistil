import { users, json } from '../lib/site.mjs';

// כמה משתמשים נכנסו לאתר עם חשבון Google (ספירה של משתמשים ייחודיים)
export default async () => {
  try {
    const store = users();
    let n = 0;
    for await (const page of store.list({paginate: true})) n += page.blobs.length;
    return json({users: n}, 200, {'Cache-Control': 'public, max-age=20'});
  } catch (e) {
    return json({error: e.message}, 500);
  }
};
export const config = { path: '/api/stats' };
