import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressToBase64Url, decompressFromBase64Url, generateShareUrl, getSharedDataFromUrl, clearShareDataFromUrl, generateShareUrlViaApi, getSharedIdFromUrl, fetchSharedDataById } from './shareUrl';

describe('shareUrl utilities', () => {
  describe('compressToBase64Url / decompressFromBase64Url', () => {
    it('should round-trip a simple string', async () => {
      const original = 'Hello, world!';
      const compressed = await compressToBase64Url(original);
      const decompressed = await decompressFromBase64Url(compressed);
      expect(decompressed).toBe(original);
    });

    it('should round-trip CSV data', async () => {
      const csv = `Type,Key,Value
Metadata,ExportedAt,2026-06-03T16:38:11.527Z
Metadata,CurrentTeamId,12345
Data,Teams,"{\\"12345\\":{\\"id\\":\\"12345\\",\\"name\\":\\"Test Team\\",\\"players\\":[]}}"
Data,History,"{\\"12345\\":[]}"`;
      const compressed = await compressToBase64Url(csv);
      const decompressed = await decompressFromBase64Url(compressed);
      expect(decompressed).toBe(csv);
    });

    it('should produce URL-safe output (no +, /, or = characters)', async () => {
      const data = 'Test data with various characters: !@#$%^&*(){}[]<>';
      const compressed = await compressToBase64Url(data);
      expect(compressed).not.toMatch(/[+/=]/);
    });

    it('should handle large data', async () => {
      const largeData = 'x'.repeat(10000);
      const compressed = await compressToBase64Url(largeData);
      const decompressed = await decompressFromBase64Url(compressed);
      expect(decompressed).toBe(largeData);
      // Compressed should be significantly smaller than original
      expect(compressed.length).toBeLessThan(largeData.length);
    });
  });

  describe('generateShareUrl', () => {
    it('should produce a URL with ?data= query parameter', async () => {
      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const url = await generateShareUrl(csv);
      expect(url).toContain('?data=');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('getSharedDataFromUrl', () => {
    afterEach(() => {
      // Reset hash and search
      window.location.hash = '';
      history.replaceState(null, '', window.location.pathname);
    });

    it('should return null when no data is present', async () => {
      history.replaceState(null, '', window.location.pathname);
      window.location.hash = '';
      const result = await getSharedDataFromUrl();
      expect(result).toBeNull();
    });

    it('should return null for unrelated query params or hashes', async () => {
      window.location.hash = '#something-else';
      const result = await getSharedDataFromUrl();
      expect(result).toBeNull();
    });

    it('should decompress data from a valid ?data= query parameter', async () => {
      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const compressed = await compressToBase64Url(csv);
      history.replaceState(null, '', `${window.location.pathname}?data=${compressed}`);
      const result = await getSharedDataFromUrl();
      expect(result).toBe(csv);
    });

    it('should decompress data from a legacy #import= hash', async () => {
      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const compressed = await compressToBase64Url(csv);
      window.location.hash = `#import=${compressed}`;
      const result = await getSharedDataFromUrl();
      expect(result).toBe(csv);
    });
  });

  describe('clearShareDataFromUrl', () => {
    it('should clear a ?data= query parameter', () => {
      history.replaceState(null, '', `${window.location.pathname}?data=abc123`);
      clearShareDataFromUrl();
      expect(window.location.search).toBe('');
    });

    it('should clear a legacy #import= hash', () => {
      window.location.hash = '#import=abc123';
      clearShareDataFromUrl();
      expect(window.location.hash).toBe('');
    });

    it('should not clear unrelated hashes', () => {
      window.location.hash = '#other';
      clearShareDataFromUrl();
      expect(window.location.hash).toBe('#other');
    });
  });

  describe('generateShareUrlViaApi', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call the share API and return a URL with ?share=<id>', async () => {
      const mockId = '12345678-1234-1234-1234-123456789abc';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: mockId }),
      });

      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const url = await generateShareUrlViaApi(csv);

      expect(global.fetch).toHaveBeenCalledWith('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: csv }),
      });
      expect(url).toContain(`?share=${mockId}`);
    });

    it('should fall back to compressed URL when the API returns a non-OK response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const url = await generateShareUrlViaApi(csv);
      expect(url).toContain('?data=');
    });

    it('should fall back to compressed URL when the fetch itself fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const url = await generateShareUrlViaApi(csv);
      expect(url).toContain('?data=');
    });
  });

  describe('getSharedIdFromUrl', () => {
    afterEach(() => {
      history.replaceState(null, '', window.location.pathname);
    });

    it('should return the share ID from a ?share= query parameter', () => {
      const id = '12345678-1234-1234-1234-123456789abc';
      history.replaceState(null, '', `${window.location.pathname}?share=${id}`);
      expect(getSharedIdFromUrl()).toBe(id);
    });

    it('should return null when no share parameter is present', () => {
      history.replaceState(null, '', window.location.pathname);
      expect(getSharedIdFromUrl()).toBeNull();
    });
  });

  describe('fetchSharedDataById', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and return shared data from the API', async () => {
      const csvData = 'Type,Key,Value\nData,Teams,"{}"';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: csvData }),
      });

      const result = await fetchSharedDataById('test-id');
      expect(global.fetch).toHaveBeenCalledWith('/api/share?id=test-id');
      expect(result).toBe(csvData);
    });

    it('should return null when the API returns an error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchSharedDataById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should return null when the fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchSharedDataById('test-id');
      expect(result).toBeNull();
    });
  });
});
