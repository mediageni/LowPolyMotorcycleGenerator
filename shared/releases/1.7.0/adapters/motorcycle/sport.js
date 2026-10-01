import * as THREE from "three";
import {
  part,
  mesh,
  box,
  tube,
  mergePart,
  chamferedBox,
} from "@engine/geometry.js";

// Original superbike surfaces: sculpted tank, pointed raised tail, deep lower
// fairing and compact twin lamps. Uses the same chassis anchors as every mount.
function hullGeometry(sections) {
  const p = [],
    indices = [],
    n = 8;
  for (const [x, y, ry, rz] of sections)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      p.push(x, y + Math.sin(a) * ry, Math.cos(a) * rz);
    }
  for (let i = 0; i < sections.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * n + j,
        b = a + n,
        c = i * n + ((j + 1) % n) + n,
        d = i * n + ((j + 1) % n);
      indices.push(a, b, c, a, c, d);
    }
  for (const end of [0, sections.length - 1]) {
    const c = p.length / 3;
    p.push(sections[end][0], sections[end][1], 0);
    for (let j = 0; j < n; j++) {
      const a = end * n + j,
        b = end * n + ((j + 1) % n);
      indices.push(c, ...(end ? [b, a] : [a, b]));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function sportTankGeometry(p, a) {
  const w = p.wheelbase,
    t = a.wheelWidth,
    y = a.seatY;
  return hullGeometry([
    [-w * 0.16, y + 0.07, 0.065, t * 0.72],
    [-w * 0.06, y + 0.13, 0.14, t * 1.14],
    [w * 0.11, y + 0.14, 0.16, t * 1.12],
    [w * 0.23, y + 0.09, 0.085, t * 0.65],
  ]);
}
export function sportTail(root, p, m, a) {
  const g = part(root, "Sport tail"),
    w = p.wheelbase,
    t = a.wheelWidth;
  mesh(
    g,
    hullGeometry([
      [a.rearRail[0] - w * 0.03, a.seatY + 0.2, 0.025, t * 0.28],
      [a.rearRail[0] + w * 0.07, a.seatY + 0.17, 0.08, t * 0.64],
      [a.seatX, a.seatY + 0.07, 0.045, t * 0.8],
    ]),
    m.body,
  );
  // Subframe supports remain even when fairing, screen and lamps are switched off.
  for (const s of [-1, 1])
    tube(
      g,
      m.frame,
      [a.rearRail[0], a.rearRail[1], s * a.railZ],
      [a.rearRail[0] + w * 0.05, a.seatY + 0.13, s * t * 0.45],
      0.023,
    );
  mergePart(g);
}
export function sportFairing(root, p, m, a) {
  const g = part(root, "Fairing"),
    w = p.wheelbase,
    t = a.wheelWidth,
    R = a.radius,
    h = a.head;
  const tankBase = a.seatY - 0.04;
  const shell = mesh(
    g,
    hullGeometry([
      [-w * 0.23, R + 0.16, 0.17, t * 0.73],
      [-w * 0.02, (R + tankBase) * 0.5, (tankBase - R) * 0.5 + 0.1, t * 1.3],
      [w * 0.19, (R + h[1]) * 0.5 - 0.03, (h[1] - R) * 0.5 + 0.03, t * 1.38],
      [h[0] + 0.04, h[1] - 0.19, 0.16, t * 1.25],
      [h[0] + 0.2, h[1] - 0.15, 0.095, t * 1.1],
    ]),
    m.body,
  );
  shell.name = "Superbike fairing";
  // Actual frame stays, rather than relying on the fairing's bounding box.
  tube(g, m.frame, [-w * 0.06, R + 0.04, 0], [-w * 0.06, R + 0.14, 0], 0.035);
  tube(g, m.frame, h, [h[0] + 0.14, h[1] - 0.15, 0], 0.025);
  for (const side of [-1, 1]) {
    // Side vents sit on the real shell surface, including extreme proportions.
    shell.updateWorldMatrix(true, false);
    const origin = new THREE.Vector3(w * 0.16, R + 0.23, side * t * 3);
    const hit = new THREE.Raycaster(
      origin,
      new THREE.Vector3(0, 0, -side),
    ).intersectObject(shell, false)[0];
    if (hit) {
      const vent = chamferedBox(
        g,
        m.frame,
        [w * 0.15, 0.065, 0.018],
        [hit.point.x, hit.point.y, hit.point.z],
        0.2,
      );
      vent.rotation.z = 0.18;
    }
  }
  mergePart(g);
}
export function sportScreen(root, p, m, a) {
  const g = part(root, "Windscreen"),
    t = a.wheelWidth,
    h = a.head;
  mesh(
    g,
    hullGeometry([
      [h[0] - 0.16, h[1] + 0.18, 0.013, t * 0.9],
      [h[0] - 0.04, h[1] + 0.13, 0.013, t * 1.12],
      [h[0] + 0.2, h[1] - 0.12, 0.013, t * 1.04],
    ]),
    m.screen,
  );
  for (const side of [-1, 1]) {
    tube(
      g,
      m.chrome,
      [a.bar[0], a.bar[1], side * a.barWidth * 0.3],
      [h[0] - 0.12, h[1] + 0.17, side * t * 0.65],
      0.014,
    );
    tube(g, m.frame, h, [h[0] + 0.19, h[1] - 0.12, 0], 0.019);
  }
  mergePart(g);
}
export function sportLamps(root, p, m, a) {
  const g = part(root, "Sport headlamps"),
    h = a.head,
    t = a.wheelWidth,
    x = h[0] + 0.21,
    y = h[1] - 0.15;
  tube(g, m.frame, h, [x - 0.02, y, 0], 0.025);
  for (const side of [-1, 1]) {
    const z = side * t * 0.58;
    tube(g, m.frame, [x - 0.02, y, 0], [x - 0.02, y, z], 0.017);
    chamferedBox(g, m.glass, [0.032, 0.039, t * 0.66], [x, y, z], 0.2);
  }
  mergePart(g);
}
