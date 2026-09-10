import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = [
  'guild-island.glb',
  'agent-0.glb',
  'agent-1.glb',
  'agent-2.glb',
  'agent-3.glb',
  'hall-level-2.glb',
  'hall-level-3.glb',
];
const results = [];
for (const file of files) {
  const data = await readFile(
    new URL('../public/assets/' + file, import.meta.url),
  );
  if (
    data.readUInt32LE(0) !== 0x46546c67 ||
    data.readUInt32LE(4) !== 2 ||
    data.readUInt32LE(8) !== data.length
  )
    throw Error(file + ': invalid GLB');
  const length = data.readUInt32LE(12);
  const json = JSON.parse(data.subarray(20, 20 + length).toString());
  if (json.buffers.some((b) => b.uri) || json.images?.some((i) => i.uri))
    throw Error(file + ': external asset dependency');
  if (!json.meshes.length) throw Error(file + ': no meshes');
  for (const a of json.accessors) {
    if (
      a.min?.some((v) => !Number.isFinite(v)) ||
      a.max?.some((v) => !Number.isFinite(v))
    )
      throw Error(file + ': invalid bounds');
  }
  const triangles = json.meshes.reduce(
    (total, m) =>
      total +
      m.primitives.reduce(
        (sum, p) =>
          sum + json.accessors[p.indices ?? p.attributes.POSITION].count / 3,
        0,
      ),
    0,
  );
  results.push({
    file,
    bytes: data.length,
    meshes: json.meshes.length,
    triangles,
    sha256: createHash('sha256').update(data).digest('hex'),
  });
}
const manifest = {
  generator: 'Blender 5.2.1 LTS',
  source: 'scripts/build_world.py',
  license: 'MIT (original procedural assets)',
  externalGenerations: 0,
  assets: results,
};
await writeFile(
  new URL('../public/assets/manifest.json', import.meta.url),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
