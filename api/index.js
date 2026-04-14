import app, { connectDB } from '../server/src/app.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Vercel bootstrap error:', error);
    return res.status(500).json({ error: 'Failed to initialize server' });
  }
}
