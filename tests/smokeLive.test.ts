/**
 * smokeLive.test.ts
 *
 * Tests the post-deploy smoke runner (scripts/smoke-live.mjs) offline with mocked
 * fetch handlers, verifying PNG fixture encoding, passing checks, and non-zero failure handling.
 */

import { describe, it, expect } from 'vitest';
import { encodeGrayscalePng, loadFixturePng, runSmokeChecks } from '../scripts/smoke-live.mjs';

function makeHealthyMockFetch(overrides: Partial<Record<string, () => Response>> = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    const origin = headers.get('origin');

    if (url === 'https://frontend.example' && method === 'GET') {
      return overrides.frontend?.() ?? new Response('<title>FractalVision Lab</title>', { status: 200 });
    }

    if (url === 'https://api.example/api/v1/health' && method === 'GET') {
      if (overrides.health) return overrides.health();
      const respHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (origin === 'https://frontend.example') {
        respHeaders['Access-Control-Allow-Origin'] = origin;
      }
      return new Response(JSON.stringify({ status: 'healthy', version: '1.0.0' }), {
        status: 200,
        headers: respHeaders,
      });
    }

    if (url === 'https://api.example/api/v1/analyze' && method === 'OPTIONS') {
      if (overrides.cors) return overrides.cors();
      const respHeaders: Record<string, string> = {};
      if (origin === 'https://frontend.example') {
        respHeaders['Access-Control-Allow-Origin'] = origin;
      }
      return new Response('OK', { status: 200, headers: respHeaders });
    }

    if (url === 'https://api.example/api/v1/analyze' && method === 'POST') {
      const form = init?.body as FormData;
      const uploaded = form.get('file') as File;
      if (uploaded.name === 'fake.png') {
        return (
          overrides.disguised?.() ??
          new Response(JSON.stringify({ detail: 'Unsupported media type' }), { status: 415 })
        );
      }
      return (
        overrides.analyze?.() ??
        new Response(
          JSON.stringify({
            result: { fractal_dimension: 1.561, r_squared: 0.9985 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      );
    }

    return new Response('Not Found', { status: 404 });
  };
}

describe('post-deploy smoke script', () => {
  it('encodes a valid PNG header from fixture pixels', () => {
    const png = encodeGrayscalePng(new Uint8Array([0, 255, 255, 0]), 2, 2);
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(2);

    const fixture = loadFixturePng();
    expect(fixture.width).toBe(1024);
    expect(fixture.height).toBe(1024);
    expect(fixture.png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  it('passes all 5 checks when endpoints behave as expected', async () => {
    const summary = await runSmokeChecks({
      frontendUrl: 'https://frontend.example',
      apiUrl: 'https://api.example/api/v1',
      fetchImpl: makeHealthyMockFetch(),
      fixture: { png: Buffer.from([137, 80, 78, 71]), theoreticalDimension: 1.585, width: 1024, height: 1024 },
    });
    expect(summary.passed).toBe(true);
    expect(summary.results).toHaveLength(5);
    expect(summary.results.every((r) => r.ok)).toBe(true);
  });

  it('reports failure when CORS fails or disguised upload returns 500', async () => {
    const summary = await runSmokeChecks({
      frontendUrl: 'https://frontend.example',
      apiUrl: 'https://api.example/api/v1',
      fetchImpl: makeHealthyMockFetch({
        cors: () => new Response('OK', { status: 200 }), // missing ACAO
        disguised: () => new Response('Internal Error', { status: 500 }),
      }),
      fixture: { png: Buffer.from([137, 80, 78, 71]), theoreticalDimension: 1.585, width: 1024, height: 1024 },
    });
    expect(summary.passed).toBe(false);
    const failedNames = summary.results.filter((r) => !r.ok).map((r) => r.name);
    expect(failedNames).toEqual(['cors_preflight', 'disguised_file_rejection']);
  });
});
