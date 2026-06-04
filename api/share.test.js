// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @vercel/blob before importing the handler
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  list: vi.fn(),
}));

import { put, list } from '@vercel/blob';
import handler from './share.js';

function makeReq(method, { body, query } = {}) {
  return { method, body: body ?? {}, query: query ?? {} };
}

function makeRes() {
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
  };
  return res;
}

describe('api/share handler', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_teststore_token123' };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('when BLOB_READ_WRITE_TOKEN is not set', () => {
    it('returns 503 with descriptive error', async () => {
      delete process.env.BLOB_READ_WRITE_TOKEN;
      const res = makeRes();
      await handler(makeReq('GET', { query: { id: '12345678-1234-1234-1234-123456789abc' } }), res);
      expect(res._status).toBe(503);
      expect(res._json).toMatchObject({ error: 'Blob storage is not configured', reason: 'BLOB_READ_WRITE_TOKEN is not set' });
    });
  });

  describe('GET /api/share', () => {
    it('returns 400 when id is missing', async () => {
      const res = makeRes();
      await handler(makeReq('GET', { query: {} }), res);
      expect(res._status).toBe(400);
      expect(res._json).toMatchObject({ error: 'Missing share ID' });
    });

    it('returns 400 for an invalid UUID format', async () => {
      const res = makeRes();
      await handler(makeReq('GET', { query: { id: 'not-a-uuid' } }), res);
      expect(res._status).toBe(400);
      expect(res._json).toMatchObject({ error: 'Invalid share ID format' });
    });

    it('returns 404 when no blobs are found', async () => {
      list.mockResolvedValue({ blobs: [] });
      const res = makeRes();
      await handler(makeReq('GET', { query: { id: '12345678-1234-1234-1234-123456789abc' } }), res);
      expect(res._status).toBe(404);
      expect(list).toHaveBeenCalledWith({ prefix: 'shares/12345678-1234-1234-1234-123456789abc', token: 'vercel_blob_rw_teststore_token123' });
    });

    it('returns the shared CSV data when blob is found', async () => {
      const csvData = 'Type,Key,Value\nData,Teams,"{}"';
      list.mockResolvedValue({ blobs: [{ url: 'https://example.com/shares/uuid' }] });
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => csvData });

      const res = makeRes();
      await handler(makeReq('GET', { query: { id: '12345678-1234-1234-1234-123456789abc' } }), res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ data: csvData });
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/shares/uuid');
    });

    it('returns 500 when blob fetch fails', async () => {
      list.mockResolvedValue({ blobs: [{ url: 'https://example.com/shares/uuid' }] });
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      const res = makeRes();
      await handler(makeReq('GET', { query: { id: '12345678-1234-1234-1234-123456789abc' } }), res);

      expect(res._status).toBe(500);
      expect(res._json).toMatchObject({ error: 'Failed to retrieve shared data' });
    });

    it('returns 500 with reason when list throws an error', async () => {
      list.mockRejectedValue(new Error('Blob store unavailable'));

      const res = makeRes();
      await handler(makeReq('GET', { query: { id: '12345678-1234-1234-1234-123456789abc' } }), res);

      expect(res._status).toBe(500);
      expect(res._json).toMatchObject({ error: 'Failed to retrieve shared data', reason: 'Blob store unavailable' });
    });
  });

  describe('POST /api/share', () => {
    it('returns 400 when data is missing', async () => {
      const res = makeRes();
      await handler(makeReq('POST', { body: {} }), res);
      expect(res._status).toBe(400);
      expect(res._json).toMatchObject({ error: 'Missing data to share' });
    });

    it('stores the data and returns a UUID', async () => {
      put.mockResolvedValue({ url: 'https://example.com/shares/uuid' });
      const csvData = 'Type,Key,Value\nData,Teams,"{}"';

      const res = makeRes();
      await handler(makeReq('POST', { body: { data: csvData } }), res);

      expect(res._status).toBe(201);
      expect(res._json).toHaveProperty('id');
      const { id } = res._json;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
      expect(put).toHaveBeenCalledWith(
        `shares/${id}`,
        csvData,
        { access: 'public', contentType: 'text/plain', token: 'vercel_blob_rw_teststore_token123' },
      );
    });

    it('returns 500 with reason when put throws an error', async () => {
      put.mockRejectedValue(new Error('Store quota exceeded'));

      const res = makeRes();
      await handler(makeReq('POST', { body: { data: 'some csv' } }), res);

      expect(res._status).toBe(500);
      expect(res._json).toMatchObject({ error: 'Failed to store shared data', reason: 'Store quota exceeded' });
    });
  });

  describe('unsupported methods', () => {
    it('returns 405 for DELETE', async () => {
      const res = makeRes();
      await handler(makeReq('DELETE'), res);
      expect(res._status).toBe(405);
      expect(res._json).toMatchObject({ error: 'Method not allowed' });
    });
  });
});
