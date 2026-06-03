import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressToBase64Url, decompressFromBase64Url, generateShareUrl, getSharedDataFromUrl, clearShareDataFromUrl } from './shareUrl';

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
    it('should produce a URL with #import= fragment', async () => {
      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const url = await generateShareUrl(csv);
      expect(url).toContain('#import=');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('getSharedDataFromUrl', () => {
    const originalLocation = window.location;

    afterEach(() => {
      // Reset hash
      window.location.hash = '';
    });

    it('should return null when no hash is present', async () => {
      window.location.hash = '';
      const result = await getSharedDataFromUrl();
      expect(result).toBeNull();
    });

    it('should return null for unrelated hashes', async () => {
      window.location.hash = '#something-else';
      const result = await getSharedDataFromUrl();
      expect(result).toBeNull();
    });

    it('should decompress data from a valid #import= hash', async () => {
      const csv = 'Type,Key,Value\nData,Teams,"{}"';
      const compressed = await compressToBase64Url(csv);
      window.location.hash = `#import=${compressed}`;
      const result = await getSharedDataFromUrl();
      expect(result).toBe(csv);
    });
  });

  describe('clearShareDataFromUrl', () => {
    it('should clear an #import= hash', () => {
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
});
