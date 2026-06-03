import { put, list } from '@vercel/blob';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Check that blob storage is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Blob storage is not configured', reason: 'BLOB_READ_WRITE_TOKEN is not set' });
  }

  // GET: retrieve shared data by ID
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing share ID' });
    }

    // Validate UUID format to prevent path traversal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid share ID format' });
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
      return res.status(500).json({ error: 'Failed to retrieve shared data', reason: error.message });
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
      return res.status(500).json({ error: 'Failed to store shared data', reason: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
