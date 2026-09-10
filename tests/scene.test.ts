import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { batchStaticScene } from '../src/scene.ts';
async function load(name: string) {
  const bytes = await readFile(
    new URL('../public/assets/' + name, import.meta.url),
  );
  return new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
}
void test('Blender island loads and batching preserves bounds while reducing draw calls', async () => {
  const gltf = await load('guild-island.glb');
  const before = new THREE.Box3().setFromObject(gltf.scene);
  const merged = batchStaticScene(gltf.scene);
  const after = new THREE.Box3().setFromObject(merged);
  assert.ok(before.min.distanceTo(after.min) < 0.0001);
  assert.ok(before.max.distanceTo(after.max) < 0.0001);
  assert.ok(merged.children.length < 25);
  assert.ok(after.max.x - after.min.x > 15);
  assert.ok(after.max.y > 3);
});
for (const file of [
  'agent-0.glb',
  'agent-1.glb',
  'agent-2.glb',
  'agent-3.glb',
  'hall-level-2.glb',
  'hall-level-3.glb',
])
  void test(`${file} is a loadable nonempty game asset`, async () => {
    const model = await load(file);
    const bounds = new THREE.Box3().setFromObject(model.scene);
    assert.ok(!bounds.isEmpty());
    assert.ok(bounds.max.y > 0);
    assert.ok(Number.isFinite(bounds.min.x));
  });
