export default function handler(req, res) {
  if (req.method === 'POST') {
    const { level, message, meta } = req.body;
    
    console[level](`[CLIENT LOG - ${level.toUpperCase()}]:`, message, meta || '');

    res.status(200).json({ status: 'ok' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}