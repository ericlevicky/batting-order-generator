import { put, list } from '@vercel/blob';
import crypto from 'crypto';

export default async function handler(req, res) {
  // GET: retrieve shared data by ID
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing share ID' });
    }

    try {
      // List blobs with the prefix to find our file
      const { blobs } = await list({ prefix: `shares/${id}` });

      if (blobs.length === 0) {
        return res.status(404).json({ error: 'Share not found' });
      }

      // Fetch the blob content
      const response = await fetch(blobs[0].url);
      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to retrieve shared data' });
      }

      const data = await response.text();
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error retrieving share:', error);
      return res.status(500).json({ error: 'Failed to retrieve shared data' });
    }
  }

  // POST: store shared data and return an ID
  if (req.method === 'POST') {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing data to share' });
    }

    try {
      const id = crypto.randomUUID();
      const pathname = `shares/${id}`;

      await put(pathname, data, {
        access: 'public',
        contentType: 'text/plain',
      });

      return res.status(201).json({ id });
    } catch (error) {
      console.error('Error storing share:', error);
      return res.status(500).json({ error: 'Failed to store shared data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
