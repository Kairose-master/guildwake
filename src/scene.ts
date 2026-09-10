import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Static Blender scene is batched by material to avoid hundreds of draw calls. */
export function batchStaticScene(source: THREE.Group): THREE.Group {
  source.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  source.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || Array.isArray(obj.material)) return;
    const geometry = obj.geometry.index
      ? obj.geometry.toNonIndexed()
      : obj.geometry.clone();
    geometry.applyMatrix4(obj.matrixWorld);
    for (const attribute of Object.keys(geometry.attributes))
      if (attribute !== 'position' && attribute !== 'normal')
        geometry.deleteAttribute(attribute);
    const batch = batches.get(obj.material) ?? [];
    batch.push(geometry);
    batches.set(obj.material, batch);
  });
  const result = new THREE.Group();
  for (const [material, parts] of batches) {
    const geometry = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!geometry) throw Error('Could not merge static Blender geometry');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    result.add(mesh);
  }
  source.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });
  return result;
}
