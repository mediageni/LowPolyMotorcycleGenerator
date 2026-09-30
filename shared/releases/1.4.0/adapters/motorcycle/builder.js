// Pure builder: params -> THREE.Group (a real, flat-shaded low-poly motorcycle).
// Built from primitives along +X (front of the bike): two faceted WHEELS, a raked
// FRONT FORK + handlebars, a FRAME of tubes, an ENGINE block, a TANK, a SEAT and an
// EXHAUST. `form` reshapes the proportions (cruiser/sport/cafe/chopper/scrambler) or
// swaps in a step-through SCOOTER body. No UI, no globals. Deterministic from seed.

import * as THREE from "three";
import { addMotorcycleDetails } from "./details.js";
import { detailed } from "@engine/options.js";
import { motorcycleLayout } from "./layout.js";
import { sportTankGeometry, sportTail, sportLamps } from "./sport.js";
import {
  tube as detailTube,
  mergePart,
  chamferedBox,
} from "@engine/geometry.js";

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
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
function box(group, w, h, d, mat, cx, cy, cz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(cx, cy, cz);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
// a faceted wheel (tire + rim + hub) centred at (x, R), axle along Z
function wheel(group, x, R, width, mats, p) {
  const g = new THREE.Group();
  g.name = x > 0 ? "Front wheel" : "Rear wheel";
  const tire = new THREE.Mesh(
    detailed(p)
      ? new THREE.TorusGeometry(R - width * 0.5, width * 0.5, 6, 16)
      : new THREE.CylinderGeometry(R, R, width, 16),
    mats.tire,
  );
  const rim = new THREE.Mesh(
    detailed(p) && p.wheelType === "spoke"
      ? new THREE.TorusGeometry(R * 0.6, R * 0.045, 4, 16)
      : new THREE.CylinderGeometry(R * 0.58, R * 0.58, width * 1.04, 16),
    mats.rim,
  );
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.16, R * 0.16, width * 1.1, 8),
    mats.chrome,
  );
  for (const m of [tire, rim, hub]) {
    m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  if (detailed(p)) {
    tire.rotation.x = 0;
    if (p.wheelType === "spoke") {
      rim.rotation.x = 0;
      for (let k = 0; k < 12; k++)
        for (const side of [-1, 1]) {
          const a = (k * Math.PI) / 6;
          detailTube(
            g,
            mats.chrome,
            [0, 0, side * width * 0.25],
            [Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, side * R * 0.018],
            R * 0.015,
            4,
          );
        }
    }
    if (["dirt", "adventure"].includes(p.form)) {
      for (let k = 0; k < 24; k++) {
        const angle = (k * Math.PI) / 12;
        const block = box(
          g,
          R * 0.1,
          R * 0.08,
          width * 0.85,
          mats.tire,
          Math.cos(angle) * (R - R * 0.015),
          Math.sin(angle) * (R - R * 0.015),
          0,
        );
        block.rotation.z = angle - Math.PI / 2;
      }
    }
  }
  g.position.set(x, R, 0);
  group.add(g);
  if (detailed(p)) mergePart(g);
  return g;
}

function buildScooter(g, p, mats) {
  const wb = p.wheelbase,
    R = p.wheelR * 0.82;
  const fx = wb / 2,
    rx = -wb / 2;
  wheel(g, fx, R, p.wheelR * 0.34, mats, p);
  wheel(g, rx, R, p.wheelR * 0.34, mats, p);
  const floorY = R + 0.06;
  box(g, wb * 0.6, 0.1, 0.34, mats.frame, 0, floorY, 0); // floorboard
  tube(
    g,
    V(wb * 0.25, floorY, 0),
    V(fx - 0.08, R + 0.32, 0),
    0.045,
    mats.frame,
  );
  // Carry the rear cowl and seat on the floorboard instead of leaving an air gap.
  box(g, wb * 0.37, 0.2, 0.28, mats.frame, rx + 0.15, R + 0.19, 0);
  tube(g, V(rx, R, 0), V(rx + 0.15, R + 0.36, 0), 0.045, mats.frame);
  if (detailed(p))
    chamferedBox(
      g,
      mats.body,
      [wb * 0.55, 0.48, 0.4],
      [rx + 0.15, R + 0.49, 0],
      0.25,
    );
  else box(g, wb * 0.5, 0.5, 0.4, mats.body, rx + 0.15, R + 0.5, 0); // rear body / engine cowl
  const shield = detailed(p)
    ? chamferedBox(
        g,
        mats.body,
        [0.4, 0.8, 0.14],
        [fx - 0.05, R + 0.55, 0],
        0.22,
      )
    : box(g, 0.14, 0.8, 0.4, mats.body, fx - 0.05, R + 0.55, 0);
  if (detailed(p)) shield.geometry.rotateY(Math.PI / 2);
  shield.rotation.z = -0.22;
  box(g, 0.5, 0.12, 0.34, mats.seat, rx + 0.2, R + 0.82, 0); // seat
  box(g, 0.35, 0.09, 0.25, mats.frame, rx + 0.2, R + 0.755, 0);
  tube(g, V(fx, R, 0), V(fx - 0.08, R + 0.95, 0), 0.035, mats.chrome); // steering column
  tube(
    g,
    V(fx - 0.1, R + 0.95, 0.26),
    V(fx - 0.1, R + 0.95, -0.26),
    0.03,
    mats.chrome,
  ); // bars
  const hl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12),
    mats.glass,
  );
  hl.rotation.z = Math.PI / 2;
  hl.position.set(fx + 0.04, R + 0.7, 0);
  if (p.lightsOn !== false) g.add(hl);
  else hl.geometry.dispose();
}

function buildBike(g, p, mats) {
  const wb = p.wheelbase,
    R = p.wheelR,
    tw = p.wheelR * 0.42;
  const fx = wb / 2,
    rx = -wb / 2;

  // front fork: from front hub up & back to the steering head, raked by p.rake
  const layout = motorcycleLayout(p);
  const head = V(...layout.head);
  wheel(g, fx, R, tw, mats, p);
  wheel(g, rx, R * (p.form === "chopper" ? 1.05 : 1.0), tw, mats, p);
  for (const z of [0.1, -0.1])
    tube(g, V(fx, R, z), V(head.x, head.y, z), 0.035, mats.chrome);
  tube(g, V(head.x, head.y, -0.11), V(head.x, head.y, 0.11), 0.035, mats.frame);

  // steering + bars + headlight
  const barW = layout.barWidth;
  const barY = layout.bar[1];
  tube(g, head, V(head.x - 0.04, barY, 0), 0.028, mats.chrome);
  tube(
    g,
    V(head.x - 0.04, barY, barW / 2),
    V(head.x - 0.04, barY, -barW / 2),
    0.025,
    mats.chrome,
  );
  const hl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14),
    mats.glass,
  );
  hl.rotation.z = Math.PI / 2;
  hl.position.set(head.x + 0.06, head.y - 0.12, 0);
  hl.castShadow = true;
  if (p.lightsOn !== false && !(detailed(p) && p.form === "sport")) g.add(hl);
  else hl.geometry.dispose();

  // engine, frame, tank, seat heights
  const seatY = layout.seatY;
  const engY = R + 0.04;
  box(g, wb * 0.34, 0.42, tw * 1.5, mats.engine, -wb * 0.02, engY + 0.05, 0); // engine block
  box(g, wb * 0.18, 0.16, tw * 1.2, mats.chrome, wb * 0.02, engY + 0.32, 0); // cylinder head detail

  // frame tubes
  const seatFront = V(-wb * 0.05, seatY - 0.02, 0);
  tube(g, head, seatFront, 0.04, mats.frame); // backbone
  tube(g, head, V(-wb * 0.08, engY, 0), 0.04, mats.frame); // downtube
  tube(g, seatFront, V(rx, R + 0.06, 0), 0.035, mats.frame); // seat rail to rear hub
  tube(g, V(-wb * 0.08, engY, 0), V(rx, R + 0.06, 0), 0.035, mats.frame); // swingarm

  // tank (tapered box) on the backbone, then seat + tail
  const tank = box(
    g,
    wb * 0.34,
    0.26,
    tw * 1.6,
    mats.body,
    wb * 0.06,
    seatY + 0.04,
    0,
  );
  tank.geometry.translate(0, 0, 0);
  tank.scale.set(1, 1, 1);
  if (detailed(p)) {
    tank.geometry.dispose();
    if (p.form === "sport") {
      tank.geometry = sportTankGeometry(p, layout);
      tank.position.set(0, 0, 0);
    } else {
      tank.geometry = new THREE.IcosahedronGeometry(1, 1);
      tank.scale.set(wb * 0.23, 0.18, tw * 1.05);
    }
    if (p.form === "dirt") tank.scale.set(wb * 0.18, 0.14, tw * 0.75);
  }
  box(
    g,
    layout.seatLength,
    0.1,
    tw * (p.form === "dirt" ? 1.05 : 1.4),
    mats.seat,
    layout.seatX,
    seatY + 0.04,
    0,
  );
  for (const side of [-1, 1]) {
    const front = V(...layout.frontRail),
      rear = V(...layout.rearRail);
    front.z = rear.z = side * layout.railZ;
    tube(g, front, rear, 0.03, mats.frame);
    tube(g, seatFront, front, 0.035, mats.frame);
    tube(g, V(rx, layout.rearRadius, side * tw * 0.5), rear, 0.03, mats.frame);
  }
  // Tank saddle links its underside to the actual backbone at that X coordinate.
  const tankX = wb * 0.06;
  const t = Math.max(
    0,
    Math.min(1, (tankX - seatFront.x) / Math.max(0.001, head.x - seatFront.x)),
  );
  tube(
    g,
    seatFront.clone().lerp(head, t),
    V(tankX, seatY, 0),
    0.06,
    mats.frame,
  );
  if (p.form === "sport" && detailed(p)) sportTail(g, p, mats, layout);
  else if (p.form === "sport" || p.form === "cafe") {
    // upswept tail
    const tail = box(
      g,
      wb * 0.16,
      0.16,
      tw * 1.2,
      mats.body,
      rx + wb * 0.12,
      seatY + 0.12,
      0,
    );
    tail.rotation.z = -0.3;
  }

  // exhaust along the lower right side
  tube(
    g,
    V(wb * 0.05, engY - 0.06, tw * 0.6),
    V(wb * 0.05, engY - 0.06, 0.16),
    0.035,
    mats.chrome,
  );
  tube(
    g,
    V(wb * 0.05, engY - 0.06, 0.16),
    V(rx + 0.05, R + 0.02, 0.22),
    0.05,
    mats.chrome,
    10,
  );

  // fenders for scrambler / cruiser
  if (!detailed(p) && (p.form === "scrambler" || p.form === "cruiser")) {
    const fender = (x, rr) => {
      const m = box(
        g,
        rr * 1.3,
        0.04,
        tw * 1.1,
        mats.body,
        x,
        rr * 2 + 0.12,
        0,
      );
      for (const side of [-1, 1]) {
        const anchor =
          x === fx
            ? head.clone().lerp(V(fx, R, 0), 0.65)
            : V(...layout.rearRail);
        anchor.z = side * tw * 0.4;
        tube(
          g,
          anchor,
          V(x, rr * 2 + 0.12, side * tw * 0.4),
          0.015,
          mats.frame,
        );
      }
      return m;
    };
    fender(fx, R);
    fender(rx, R);
  }
}

export function buildMotorcycle(p, mats) {
  const g = new THREE.Group();
  g.name = "motorcycle";
  if (p.form === "scooter") buildScooter(g, p, mats);
  else buildBike(g, p, mats);
  const layout = motorcycleLayout(p);
  if (p.lightsOn !== false && detailed(p) && p.form === "sport") {
    sportLamps(g, p, mats, layout);
  } else if (p.lightsOn !== false) {
    const mount = new THREE.Group();
    mount.name = "Headlamp bracket";
    const forkPoint = new THREE.Vector3(...layout.head).lerp(
      V(layout.frontX, layout.radius, 0),
      0.18,
    );
    tube(mount, forkPoint, V(...layout.lamp), 0.026, mats.frame);
    g.add(mount);
  }
  addMotorcycleDetails(g, p, mats);

  const box3 = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3(),
    center = new THREE.Vector3();
  box3.getSize(size);
  box3.getCenter(center);
  g.userData.size = size;
  g.userData.center = center;
  return g;
}
