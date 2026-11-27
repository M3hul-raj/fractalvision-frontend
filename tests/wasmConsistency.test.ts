/**
 * wasmConsistency.test.ts
 *
 * Verifies that the compiled C++ WebAssembly binary (public/wasm/box_counting.wasm)
 * and the pure-TypeScript implementation (src/lib/wasm/boxCountingJs.ts) produce
 * identical box counts and matching fractal dimensions across all 5 fractal fixtures.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';
import { runBoxCountingJs } from '@/lib/wasm/boxCountingJs';

const require = createRequire(import.meta.url);

interface FixtureData {
  fractal_id: string;
  width: number;
  height: number;
  pixels_base64: string;
}

const FIXTURE_IDS = [
  'cantor_set',
  'koch_curve',
  'koch_snowflake',
  'sierpinski_triangle',
  'sierpinski_carpet',
] as const;

describe('WASM vs JS numerical parity', () => {
  it('produces identical box counts and D within 1e-9 across all fixtures', async () => {
    const wasmDir = resolve(__dirname, '../public/wasm');
    const createBoxCountingModule = require(resolve(wasmDir, 'box_counting.js'));
    const wasmBinary = readFileSync(resolve(wasmDir, 'box_counting.wasm'));
    const wasm = await createBoxCountingModule({ wasmBinary });

    for (const id of FIXTURE_IDS) {
      const raw = readFileSync(resolve(__dirname, 'fixtures', `${id}.json`), 'utf-8');
      const fixture = JSON.parse(raw) as FixtureData;
      const pixels = new Uint8Array(Buffer.from(fixture.pixels_base64, 'base64'));

      const jsRes = runBoxCountingJs(pixels, fixture.width, fixture.height);

      const ptr = wasm._malloc(pixels.length);
      expect(ptr).toBeGreaterThan(0);
      wasm.HEAPU8.set(pixels, ptr);
      const resPtr = wasm._wasm_run_analysis(ptr, fixture.width, fixture.height);
      const wasmRes = JSON.parse(wasm.UTF8ToString(resPtr));
      wasm._wasm_free(resPtr);
      wasm._free(ptr);

      expect(wasmRes.box_sizes).toEqual(jsRes.box_sizes);
      expect(wasmRes.box_counts).toEqual(jsRes.box_counts);
      expect(Math.abs(wasmRes.fractal_dimension - jsRes.fractal_dimension)).toBeLessThan(1e-9);
      expect(Math.abs(wasmRes.r_squared - jsRes.r_squared)).toBeLessThan(1e-9);
    }
  });
});
