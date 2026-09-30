import * as THREE from "three";
import {
  part,
  box,
  tube,
  ring,
  cylinder,
  mesh,
  mergePart,
} from "@engine/geometry.js";
import {
  detailOption,
  detailRule,
  booleanRule,
  detailed,
  choices,
  toggle,
} from "@engine/options.js";
export function enrichMotorcycle(params, legacy = false) {
  return {
    ...params,
    detailVersion: legacy ? 0 : 1,
    wheelType: params.form === "sport" ? "alloy" : "spoke",
    mirrorsOn: true,
    brakesOn: true,
    coolingOn: true,
    fendersOn: true,
    lightsOn: true,
    screenOn: ["sport", "scooter"].includes(params.form),
    fairingOn: params.form === "sport",
    luggageOn: false,
  };
}
export const MOTORCYCLE_SCHEMA = {
  detailVersion: detailRule,
  wheelType: { type: "enum", values: ["alloy", "spoke"] },
  ...Object.fromEntries(
    [
      "mirrorsOn",
      "brakesOn",
      "coolingOn",
      "fendersOn",
      "screenOn",
      "fairingOn",
      "luggageOn",
      "lightsOn",
    ].map((key) => [key, booleanRule]),
  ),
};
export const MOTORCYCLE_OPTIONS = [
  detailOption,
  choices(
    "wheelType",
    "Wheel design",
    [
      ["alloy", "Alloy"],
      ["spoke", "Spokes"],
    ],
    detailed,
  ),
  toggle("mirrorsOn", "Mirrors & grips"),
  toggle("brakesOn", "Brake discs & suspension"),
  toggle(
    "coolingOn",
    "Engine fins",
    (p) => detailed(p) && p.form !== "scooter",
  ),
  toggle("fendersOn", "Curved fenders"),
  toggle("screenOn", "Windscreen"),
  toggle(
    "fairingOn",
    "Sport fairing",
    (p) => detailed(p) && p.form !== "scooter",
  ),
  toggle("luggageOn", "Luggage"),
  toggle("lightsOn", "Lighting", () => true),
];
export function addMotorcycleDetails(root, p, mats) {
  if (!detailed(p)) return;
  const wb = p.wheelbase,
    R = p.wheelR * (p.form === "scooter" ? 0.82 : 1),
    fx = wb / 2,
    rx = -wb / 2;
  const forkLen = 0.62 + p.stance * 0.4;
  const hx = p.form === "scooter" ? fx - 0.1 : fx - Math.sin(p.rake) * forkLen;
  const hy = p.form === "scooter" ? R + 0.95 : R + Math.cos(p.rake) * forkLen;
  const seatY = p.form === "scooter" ? R + 0.82 : R + p.stance;
  if (p.mirrorsOn) {
    const group = part(root, "Mirrors and grips");
    const barW =
      p.form === "sport"
        ? 0.34
        : ["cruiser", "chopper"].includes(p.form)
          ? 0.62
          : 0.46;
    for (const side of [-1, 1]) {
      const base = [hx - 0.04, hy + 0.08, (side * barW) / 2];
      const end = [hx + 0.01, hy + 0.25, side * (barW / 2 + 0.1)];
      tube(group, mats.chrome, base, end, 0.012);
      box(group, mats.screen, [0.035, 0.08, 0.12], end);
      const grip = cylinder(
        group,
        mats.seat,
        0.034,
        0.09,
        [base[0], base[1], base[2]],
        8,
      );
      grip.rotation.x = Math.PI / 2;
    }
    mergePart(group);
  }
  if (p.brakesOn) {
    const group = part(root, "Brakes and suspension");
    for (const [x, r] of [
      [fx, R],
      [rx, R * (p.form === "chopper" ? 1.05 : 1)],
    ]) {
      const disc = cylinder(
        group,
        mats.chrome,
        r * 0.53,
        0.018,
        [x, r, r * 0.25],
        12,
      );
      disc.rotation.x = Math.PI / 2;
      ring(group, mats.frame, r * 0.37, r * 0.027, [x, r, r * 0.28]);
      box(
        group,
        mats.body,
        [r * 0.16, r * 0.28, 0.065],
        [x + r * 0.4, r + 0.04, r * 0.29],
      );
    }
    for (const side of [-1, 1]) {
      const a = [rx, R + 0.09, side * 0.12],
        b = [-wb * 0.2, seatY - 0.05, side * 0.15];
      tube(group, mats.chrome, a, b, 0.028);
      for (let k = 1; k < 6; k++) {
        const t = k / 7,
          point = a.map((v, i) => v + (b[i] - v) * t);
        const spring = ring(group, mats.frame, 0.046, 0.009, point);
        spring.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize(),
        );
      }
    }
    mergePart(group);
  }
  if (p.coolingOn && p.form !== "scooter") {
    const group = part(root, "Engine fins");
    for (let k = 0; k < 5; k++)
      box(
        group,
        mats.chrome,
        [wb * 0.29, 0.018, p.wheelR * 0.76],
        [-wb * 0.02, R + 0.1 + k * 0.055, 0],
      );
    mergePart(group);
  }
  if (p.fendersOn) {
    const group = part(root, "Fenders");
    for (const x of [fx, rx]) {
      const fender = mesh(
        group,
        new THREE.TorusGeometry(R * 1.16, R * 0.09, 4, 12, Math.PI * 0.68),
        mats.body,
        [x, R, 0],
      );
      fender.rotation.z = Math.PI * 0.16;
      fender.scale.z = 1.35;
    }
    mergePart(group);
  }
  if (p.screenOn) {
    const group = part(root, "Windscreen");
    const screen = box(
      group,
      mats.screen,
      [0.023, 0.28, 0.28],
      [hx + 0.025, hy + 0.08, 0],
    );
    screen.rotation.z = -0.23;
    for (const side of [-1, 1])
      tube(
        group,
        mats.chrome,
        [hx + 0.06, hy - 0.04, side * 0.13],
        [hx - 0.01, hy + 0.21, side * 0.13],
        0.009,
      );
    mergePart(group);
  }
  if (p.fairingOn && p.form !== "scooter") {
    const group = part(root, "Fairing");
    const shell = mesh(group, new THREE.DodecahedronGeometry(1, 0), mats.body, [
      wb * 0.18,
      R + 0.26,
      0,
    ]);
    shell.scale.set(wb * 0.29, 0.3, p.wheelR * 0.64);
    for (const side of [-1, 1])
      box(
        group,
        mats.frame,
        [wb * 0.17, 0.035, 0.014],
        [wb * 0.22, R + 0.25, side * p.wheelR * 0.65],
      );
    mergePart(group);
  }
  if (p.luggageOn) {
    const group = part(root, "Luggage");
    if (p.form === "scooter")
      box(
        group,
        mats.body,
        [wb * 0.28, 0.24, 0.32],
        [rx - 0.04, seatY + 0.23, 0],
      );
    else
      for (const side of [-1, 1]) {
        const pos = [rx + 0.14, seatY - 0.05, side * 0.32];
        box(group, mats.seat, [wb * 0.27, 0.28, 0.2], pos);
        box(
          group,
          mats.chrome,
          [0.035, 0.23, 0.21],
          [pos[0] - 0.05, pos[1], pos[2]],
        );
      }
    mergePart(group);
  }
  if (p.lightsOn) {
    const group = part(root, "Signals and tail lamp");
    box(group, mats.tail, [0.05, 0.07, 0.15], [rx - 0.07, seatY + 0.015, 0]);
    for (const side of [-1, 1])
      for (const [x, y] of [
        [hx + 0.07, hy - 0.12],
        [rx, seatY],
      ]) {
        tube(
          group,
          mats.chrome,
          [x, y, side * 0.1],
          [x, y, side * 0.23],
          0.012,
        );
        box(group, mats.signal, [0.05, 0.045, 0.06], [x, y, side * 0.24]);
      }
    mergePart(group);
  }
}
