/**
 * apiClient.test.ts
 *
 * Unit tests for src/lib/api/client.ts error parsing and request behavior.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeImage, generateFractal } from '@/lib/api/client';

describe('API client error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts backend detail string on analyzeImage 4xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Unsupported image content' }), {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const file = new File(['hello'], 'bad.png', { type: 'image/png' });
    await expect(analyzeImage(file)).rejects.toThrow('Unsupported image content');
  });

  it('extracts backend detail string cleanly on generateFractal errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Unknown fractal: 'foo'" }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(generateFractal('foo')).rejects.toThrow("Unknown fractal: 'foo'");
  });

  it('falls back to status text when generateFractal error body is non-JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })),
    );

    await expect(generateFractal('cantor_set')).rejects.toThrow('Generate failed: 502 - Bad Gateway');
  });
});
