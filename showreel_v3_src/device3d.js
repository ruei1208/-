// Real CAD geometry (Inventor STL export) rendered with three.js.
// Assembled positions come from 組合.stl, exploded ones from 組合1.stl — matched vertex-for-vertex.
import * as THREE from 'three';
import { parseParts, matchTranslation } from './stl.js';

const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]);
export const D3 = {};

export async function loadDevice(W, H) {
  const f0 = parseParts(await (await fetch('assets/assembly.stl')).arrayBuffer());
  const f1 = parseParts(await (await fetch('assets/assembly1.stl')).arrayBuffer());
  const Th = matchTranslation(f1[1].verts, f0[0].verts).t;   // housing
  const Tc = matchTranslation(f1[0].verts, f0[0].verts).t;   // cartridge
  const Td = matchTranslation(f1[2].verts, f0[1].verts).t;   // dust box (pulled-out pose in 組合.stl)
  const hMin = f0[0].min, hMax = f0[0].max;
  const sx = (hMin[0] + 2) - (f1[2].min[0] + Td[0]);          // slide dust box home, centred in the 100 mm housing
  const cm = f1[0].min, cs = f1[0].size;
  const plateParts = f1.filter(p => p.tris <= 12 && Math.abs(p.size[0] - 1) < 0.01).sort((a, b) => a.min[0] - b.min[0]);
  const pl = plateParts[0];
  const L = [0, (cm[1] + cs[1] - 4) - (pl.min[1] + pl.size[1]), (cm[2] + cs[2] / 2) - (pl.min[2] + pl.size[2] / 2)];
  const defs = [
    { name: 'housing', p: f1[1], T: Th, ex: [0, 0, 0], kind: 'body' },
    { name: 'cartridge', p: f1[0], T: Tc, ex: sub(Th, Tc), kind: 'body' },
    { name: 'dust', p: f1[2], T: add(Td, [sx, 0, 0]), ex: sub(sub(Th, Td), [sx, 0, 0]), kind: 'body' },
    ...plateParts.map((p, i) => ({ name: 'plate' + i, p, T: add(Tc, L), ex: sub(sub(Th, Tc), L), kind: 'plate', local: L.map(v => -v) })),
  ];

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(250, 420, 380); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a00, 0.6); rim.position.set(-400, 150, -300); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.35); fill.position.set(-300, -100, 300); scene.add(fill);

  const center = new THREE.Vector3((hMin[0] + hMax[0]) / 2, (hMin[1] + hMax[1]) / 2, (hMin[2] + hMax[2]) / 2);
  const parts = defs.map(d => {
    const pos = d.p.pos.slice(); for (let i = 0; i < pos.length; i += 3) { pos[i] += d.T[0] - center.x; pos[i + 1] += d.T[1] - center.y; pos[i + 2] += d.T[2] - center.z; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeVertexNormals(); geo.computeBoundingBox();
    // edges sorted top-to-bottom so the line drawing sweeps down the part
    const eg = new THREE.EdgesGeometry(geo, 20), ep = eg.attributes.position.array, segs = [];
    for (let i = 0; i < ep.length; i += 6) segs.push([ep.slice(i, i + 6), -(ep[i + 1] + ep[i + 4]) / 2 + 0.25 * (ep[i] + ep[i + 3]) / 2]);
    segs.sort((a, b) => a[1] - b[1]); const sp = new Float32Array(segs.length * 6); segs.forEach((s, i) => sp.set(s[0], i * 6));
    const edgeGeo = new THREE.BufferGeometry(); edgeGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const plate = d.kind === 'plate', col = plate ? 0xff8a00 : 0xf2f2f2;
    const g = new THREE.Group();
    const occ = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })); occ.renderOrder = -1;
    const solid = new THREE.Mesh(geo, plate ? new THREE.MeshStandardMaterial({ color: 0xd7772c, metalness: 0.35, roughness: 0.38, emissive: 0x2a1000, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
                                             : new THREE.MeshStandardMaterial({ color: 0xd9d9d6, metalness: 0.0, roughness: 0.62, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    const vis = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: col }));
    const hid = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthFunc: THREE.GreaterDepth, depthWrite: false }));
    const solidEdge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: plate ? 0x7a3500 : 0x2a2a2a, transparent: true, opacity: 0.55 }));
    g.add(occ, solid, vis, hid, solidEdge); scene.add(g);
    return { ...d, g, occ, solid, vis, hid, solidEdge, nSeg: segs.length, box: geo.boundingBox };
  });
  const camera = new THREE.PerspectiveCamera(24, W / H, 10, 10000);
  Object.assign(D3, { renderer, scene, camera, parts, center, W, H, hSize: sub(hMax, hMin), L });
  return D3;
}

// pose: { cart, dust, plates:[4], pull, az, el, dist, offX, drawP }
export function setPose(p) {
  const { parts, camera, W, H } = D3;
  const pc = p.cart, pd = p.dust;
  for (const q of parts) {
    let e;
    if (q.name === 'housing') e = [0, 0, 0];
    else if (q.name === 'cartridge') e = q.ex.map(v => v * (1 - pc));
    else if (q.name === 'dust') e = q.ex.map(v => v * (1 - pd));
    else { const k = +q.name.slice(5), pp = p.plates[k], ec = parts[1].ex; e = ec.map((v, i) => v * (1 - pc) + q.local[i] * (1 - pp)); }
    if (q.name === 'cartridge' || q.kind === 'plate') e = [e[0], e[1], e[2] + (p.pull || 0)];
    q.g.position.set(e[0], e[1], e[2]);
    const n = Math.floor(q.nSeg * Math.max(0, Math.min(1, p.drawP ?? 1))) * 2;
    q.vis.geometry.setDrawRange(0, n);
  }
  const az = p.az * Math.PI / 180, el = p.el * Math.PI / 180;
  camera.position.set(Math.sin(az) * Math.cos(el) * p.dist, Math.sin(el) * p.dist + (p.lift || 0), Math.cos(az) * Math.cos(el) * p.dist);
  camera.lookAt(0, p.lookY || 0, 0);
  camera.setViewOffset(W, H, p.offX || 0, 0, W, H); camera.updateProjectionMatrix();
}
export function render(mode) {
  const { parts, renderer, scene, camera } = D3;
  for (const q of parts) { const wire = mode === 'wire'; q.occ.visible = wire; q.vis.visible = wire; q.hid.visible = wire; q.solid.visible = !wire; q.solidEdge.visible = !wire; }
  renderer.render(scene, camera); return renderer.domElement;
}
// world point (in assembled model coords, before part offsets) -> screen px
export function project(v, part = null) {
  const p = new THREE.Vector3(...v); if (part) p.add(part.g.position); p.project(D3.camera);
  return [(p.x + 1) / 2 * D3.W, (1 - p.y) / 2 * D3.H];
}
export function partCenter(name) { const q = D3.parts.find(p => p.name === name); const c = new THREE.Vector3(); q.box.getCenter(c); return project([c.x, c.y, c.z], q); }
