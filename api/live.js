// Vercel Serverless Function: /api/live
// משתמש באותה לוגיקה של הפונקציה ל-Netlify (netlify/functions/live.js), כדי שהאתר יעבוד גם ב-Vercel.
// אפשר להגדיר KICK_CLIENT_ID ו-KICK_CLIENT_SECRET ב-Vercel (Settings > Environment Variables).
const {handler} = require('../netlify/functions/live.js');

module.exports = async (req, res) => {
  const r = await handler();
  for (const k of Object.keys(r.headers || {})) res.setHeader(k, r.headers[k]);
  res.status(r.statusCode).send(r.body);
};
