// Pure builder: params -> THREE.Group (a real, flat-shaded low-poly motorcycle).
// Built from primitives along +X (front of the bike): two faceted WHEELS, a raked
// FRONT FORK + handlebars, a FRAME of tubes, an ENGINE block, a TANK, a SEAT and an
// EXHAUST. `form` reshapes the proportions (cruiser/sport/cafe/chopper/scrambler) or
// swaps in a step-through SCOOTER body. No UI, no globals. Deterministic from seed.

import * as THREE from 'three';

const Y = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// a cylinder spanning two points (for forks, frame tubes, exhaust, handlebars)
function tube(group, a, b, r, mat, seg = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 1e-4) return;
  const geo = new THREE.CylinderGeometry(r, r, len, seg);
  geo.translate(0, len / 2, 0);
  const m = new THREE.Mesh(geo, mat);
  m.quaternion.setFromUnitVectors(Y, dir.normalize());
  m.position.copy(a);
  m.castShadow = true; m.receiveShadow = true;
  group.add(m);
  return m;
}
function box(group, w, h, d, mat, cx, cy, cz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(cx, cy, cz);
  m.castShadow = true; m.receiveShadow = true;
  group.add(m);
  return m;
}
// a faceted wheel (tire + rim + hub) centred at (x, R), axle along Z
function wheel(group, x, R, width, mats) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(R, R, width, 16), mats.tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.58, R * 0.58, width * 1.04, 16), mats.rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.16, R * 0.16, width * 1.1, 8), mats.chrome);
  for (const m of [tire, rim, hub]) { m.rotation.x = Math.PI / 2; m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.position.set(x, R, 0);
  group.add(g);
  return g;
}

function buildScooter(g, p, mats) {
  const wb = p.wheelbase, R = p.wheelR * 0.82;
  const fx = wb / 2, rx = -wb / 2;
  wheel(g, fx, R, p.wheelR * 0.34, mats);
  wheel(g, rx, R, p.wheelR * 0.34, mats);
  const floorY = R + 0.06;
  box(g, wb * 0.6, 0.1, 0.34, mats.frame, 0, floorY, 0);                 // floorboard
  box(g, wb * 0.5, 0.5, 0.4, mats.body, rx + 0.15, R + 0.5, 0);          // rear body / engine cowl
  const shield = box(g, 0.14, 0.8, 0.4, mats.body, fx - 0.05, R + 0.55, 0); // front leg shield
  shield.rotation.z = -0.22;
  box(g, 0.5, 0.12, 0.34, mats.seat, rx + 0.2, R + 0.82, 0);             // seat
  tube(g, V(fx, R, 0), V(fx - 0.08, R + 0.95, 0), 0.035, mats.chrome);   // steering column
  tube(g, V(fx - 0.1, R + 0.95, 0.26), V(fx - 0.1, R + 0.95, -0.26), 0.03, mats.chrome); // bars
  const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), mats.glass);
  hl.rotation.z = Math.PI / 2; hl.position.set(fx + 0.04, R + 0.7, 0); g.add(hl);
}

function buildBike(g, p, mats) {
  const wb = p.wheelbase, R = p.wheelR, tw = p.wheelR * 0.42;
  const fx = wb / 2, rx = -wb / 2;

  // front fork: from front hub up & back to the steering head, raked by p.rake
  const forkLen = 0.62 + p.stance * 0.4;
  const head = V(fx - Math.sin(p.rake) * forkLen, R + Math.cos(p.rake) * forkLen, 0);
  wheel(g, fx, R, tw, mats);
  wheel(g, rx, R * (p.form === 'chopper' ? 1.05 : 1.0), tw, mats);
  for (const z of [0.1, -0.1]) tube(g, V(fx, R, z), V(head.x, head.y, z), 0.035, mats.chrome);

  // steering + bars + headlight
  const barW = p.form === 'sport' ? 0.34 : (p.form === 'cruiser' || p.form === 'chopper') ? 0.62 : 0.46;
  const barY = head.y + (p.form === 'sport' ? -0.04 : 0.08);
  tube(g, V(head.x - 0.04, barY, barW / 2), V(head.x - 0.04, barY, -barW / 2), 0.025, mats.chrome);
  const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14), mats.glass);
  hl.rotation.z = Math.PI / 2; hl.position.set(head.x + 0.06, head.y - 0.12, 0); hl.castShadow = true; g.add(hl);

  // engine, frame, tank, seat heights
  const seatY = R + p.stance;
  const engY = R + 0.04;
  box(g, wb * 0.34, 0.42, tw * 1.5, mats.engine, -wb * 0.02, engY + 0.05, 0);   // engine block
  box(g, wb * 0.18, 0.16, tw * 1.2, mats.chrome, wb * 0.02, engY + 0.32, 0);    // cylinder head detail

  // frame tubes
  const seatFront = V(-wb * 0.05, seatY - 0.02, 0);
  tube(g, head, seatFront, 0.04, mats.frame);                                   // backbone
  tube(g, head, V(-wb * 0.08, engY, 0), 0.04, mats.frame);                      // downtube
  tube(g, seatFront, V(rx, R + 0.06, 0), 0.035, mats.frame);                    // seat rail to rear hub
  tube(g, V(-wb * 0.08, engY, 0), V(rx, R + 0.06, 0), 0.035, mats.frame);       // swingarm

  // tank (tapered box) on the backbone, then seat + tail
  const tank = box(g, wb * 0.34, 0.26, tw * 1.6, mats.body, wb * 0.06, seatY + 0.04, 0);
  tank.geometry.translate(0, 0, 0); tank.scale.set(1, 1, 1);
  const seatLen = p.form === 'cruiser' ? wb * 0.5 : wb * 0.4;
  box(g, seatLen, 0.1, tw * 1.4, mats.seat, -wb * 0.18, seatY + 0.04, 0);
  if (p.form === 'sport' || p.form === 'cafe') {                                // upswept tail
    const tail = box(g, wb * 0.16, 0.16, tw * 1.2, mats.body, rx + wb * 0.12, seatY + 0.12, 0);
    tail.rotation.z = -0.3;
  }

  // exhaust along the lower right side
  tube(g, V(wb * 0.05, engY - 0.06, 0.16), V(rx + 0.05, R + 0.02, 0.22), 0.05, mats.chrome, 10);

  // fenders for scrambler / cruiser
  if (p.form === 'scrambler' || p.form === 'cruiser') {
    const fender = (x, rr) => { const m = box(g, rr * 1.3, 0.04, tw * 1.1, mats.body, x, rr * 2 + 0.12, 0); return m; };
    fender(fx, R); fender(rx, R);
  }
}

export function buildMotorcycle(p, mats) {
  const g = new THREE.Group();
  g.name = 'motorcycle';
  if (p.form === 'scooter') buildScooter(g, p, mats);
  else buildBike(g, p, mats);

  const box3 = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3(), center = new THREE.Vector3();
  box3.getSize(size); box3.getCenter(center);
  g.userData.size = size; g.userData.center = center;
  return g;
}
