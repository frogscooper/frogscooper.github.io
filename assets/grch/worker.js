// Runs GRCH (Rust, compiled to wasm) off the main thread.
// The page kills this worker if a seed takes too long.
let wasm;

onmessage = async ({ data }) => {
  if (!wasm) {
    const { default: b64 } = await import('./grch-wasm.js');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    wasm = (await WebAssembly.instantiate(bytes, {})).instance.exports;
  }
  const t = performance.now();
  const n = wasm.grch_generate(BigInt.asIntN(64, BigInt(data.seed)), data.size, data.depth);
  const out = new Int32Array(wasm.memory.buffer, wasm.grch_out_ptr(), n).slice();
  postMessage({ id: data.id, out, ms: performance.now() - t }, [out.buffer]);
};
