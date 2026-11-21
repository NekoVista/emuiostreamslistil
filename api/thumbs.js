// בשרת Vercel אין Netlify Blobs, לכן ה-API הזה לא זמין כאן. האתר מתמודד עם זה ופשוט מדלג על התכונה.
module.exports = (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.status(404).json({error: 'not_available_on_vercel'}); };
