import * as THREE from "three";
import { motorcycleLayout } from "./layout.js";
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
    screenOn: ["sport", "scooter", "adventure", "touring"].includes(
      params.form,
    ),
    fairingOn: ["sport", "touring", "adventure"].includes(params.form),
    luggageOn: ["adventure", "touring"].includes(params.form),
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
    "Fairing & engine guards",
    (p) => detailed(p) && p.form !== "scooter",
  ),
  toggle("luggageOn", "Luggage"),
  toggle("lightsOn", "Lighting", () => true),
];
export function addMotorcycleDetails(root, p, mats) {
  if (!detailed(p)) return;
  const a = motorcycleLayout(p),
    wb = p.wheelbase;
  const forkAt = (t, side = 0) => [
    a.frontX + (a.head[0] - a.frontX) * t,
    a.radius + (a.head[1] - a.radius) * t,
    side,
  ];
  if (p.mirrorsOn) {
    const group = part(root, "Mirrors and grips");
    for (const side of [-1, 1]) {
      const base = [a.bar[0], a.bar[1], (side * a.barWidth) / 2];
      const end = [base[0] + 0.025, base[1] + 0.17, base[2] + side * 0.07];
      tube(group, mats.chrome, base, end, 0.012);
      box(group, mats.screen, [0.035, 0.08, 0.12], end);
      const grip = cylinder(group, mats.seat, 0.034, 0.1, base, 8);
      grip.rotation.x = Math.PI / 2;
    }
    mergePart(group);
  }
  if (p.brakesOn) {
    const group = part(root, "Brakes and suspension");
    for (const [x, radius] of [
      [a.frontX, a.radius],
      [a.rearX, a.rearRadius],
    ]) {
      const z = a.wheelWidth * 0.54;
      const disc = cylinder(
        group,
        mats.chrome,
        radius * 0.52,
        0.018,
        [x, radius, z],
        12,
      );
      disc.rotation.x = Math.PI / 2;
      ring(group, mats.frame, radius * 0.37, radius * 0.02, [
        x,
        radius,
        z + 0.01,
      ]);
      const caliper = [x + radius * 0.42, radius + radius * 0.12, z + 0.015];
      box(group, mats.body, [radius * 0.18, radius * 0.27, 0.045], caliper);
      tube(group, mats.frame, [x, radius, z], caliper, 0.014);
    }
    for (const side of [-1, 1]) {
      const bottom = new THREE.Vector3(a.rearX, a.rearRadius, side * a.railZ);
      const top = new THREE.Vector3(
        a.rearRail[0] + a.seatLength * 0.27,
        a.rearRail[1],
        side * a.railZ,
      );
      tube(group, mats.chrome, bottom.toArray(), top.toArray(), 0.023);
      const axis = top.clone().sub(bottom),
        length = axis.length();
      const rotation = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        axis.clone().normalize(),
      );
      for (const t of [0.12, 0.88]) {
        const collar = cylinder(
          group,
          mats.chrome,
          0.053,
          0.018,
          bottom.clone().addScaledVector(axis, t).toArray(),
          10,
        );
        collar.quaternion.copy(rotation);
      }
      const points = [];
      for (let i = 0; i <= 88; i++) {
        const t = i / 88,
          angle = t * Math.PI * 12;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * 0.041,
            length * (0.12 + t * 0.76),
            Math.sin(angle) * 0.041,
          )
            .applyQuaternion(rotation)
            .add(bottom),
        );
      }
      mesh(
        group,
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          88,
          0.009,
          4,
          false,
        ),
        mats.frame,
      );
      for (const point of [bottom, top]) {
        const eye = ring(group, mats.chrome, 0.027, 0.012, point.toArray());
        eye.rotation.y = Math.PI / 2;
      }
    }
    mergePart(group);
  }
  if (p.coolingOn && !a.scooter) {
    const group = part(root, "Engine fins");
    for (let k = 0; k < 5; k++)
      box(
        group,
        mats.chrome,
        [wb * 0.29, 0.018, p.wheelR * 0.76],
        [-wb * 0.02, a.radius + 0.1 + k * 0.055, 0],
      );
    mergePart(group);
  }
  if (p.fendersOn) {
    const group = part(root, "Fenders");
    for (const [x, radius, front] of [
      [a.frontX, a.radius, true],
      [a.rearX, a.rearRadius, false],
    ]) {
      if (p.form === "dirt") {
        const y = front ? a.head[1] - 0.14 : a.rearRail[1] + 0.015;
        const pos = [front ? x + 0.04 : a.rearRail[0] - 0.02, y, 0];
        const blade = box(
          group,
          mats.body,
          [radius * 1.65, 0.045, a.wheelWidth * 1.45],
          pos,
        );
        blade.rotation.z = front ? -0.07 : -0.15;
        tube(group, mats.frame, front ? forkAt(0.85) : a.rearRail, pos, 0.035);
        continue;
      }
      const fender = mesh(
        group,
        new THREE.TorusGeometry(
          radius * 1.12,
          radius * 0.08,
          4,
          16,
          Math.PI * 0.68,
        ),
        mats.body,
        [x, radius, 0],
      );
      fender.rotation.z = Math.PI * 0.16;
      fender.scale.z = Math.max(1.2, a.wheelWidth / (radius * 0.12));
      const crown = [x, radius * 2.11, 0];
      if (front) {
        for (const side of [-1, 1])
          tube(
            group,
            mats.chrome,
            forkAt(0.32, side * 0.1),
            [crown[0], crown[1], side * a.wheelWidth * 0.35],
            0.014,
          );
      } else {
        tube(group, mats.frame, a.rearRail, crown, 0.022);
      }
    }
    mergePart(group);
  }
  if (p.screenOn) {
    const group = part(root, "Windscreen");
    const screen = box(
      group,
      mats.screen,
      [
        0.023,
        p.form === "touring" ? 0.4 : 0.28,
        p.form === "touring" ? 0.45 : 0.28,
      ],
      [a.bar[0] + 0.065, a.bar[1] + 0.1, 0],
    );
    screen.rotation.z = -0.23;
    for (const side of [-1, 1])
      tube(
        group,
        mats.chrome,
        [a.bar[0], a.bar[1], side * 0.13],
        [a.bar[0] + 0.055, a.bar[1] + 0.04, side * 0.13],
        0.012,
      );
    mergePart(group);
  }
  if (p.fairingOn && !a.scooter) {
    const group = part(root, "Fairing");
    if (["touring", "adventure"].includes(p.form)) {
      const touring = p.form === "touring";
      const cowl = box(
        group,
        mats.body,
        [0.2, touring ? 0.33 : 0.2, touring ? 0.52 : 0.29],
        [a.head[0] + 0.01, a.head[1] - 0.1, 0],
      );
      cowl.rotation.z = -0.15;
      tube(
        group,
        mats.frame,
        a.head,
        [a.head[0] + 0.01, a.head[1] - 0.1, 0],
        0.04,
      );
      for (const side of [-1, 1]) {
        const top = [-wb * 0.02, a.radius + 0.38, side * p.wheelR * 0.32];
        const front = [wb * 0.21, a.radius + 0.25, side * p.wheelR * 0.63];
        const bottom = [-wb * 0.08, a.radius - 0.04, side * p.wheelR * 0.32];
        tube(group, mats.chrome, top, front, 0.025);
        tube(group, mats.chrome, front, bottom, 0.025);
        tube(group, mats.frame, bottom, [bottom[0], bottom[1], 0], 0.035);
      }
      mergePart(group);
    } else {
      const shell = mesh(
        group,
        new THREE.DodecahedronGeometry(1, 0),
        mats.body,
        [wb * 0.18, a.radius + 0.26, 0],
      );
      shell.scale.set(wb * 0.29, 0.3, p.wheelR * 0.64);
      // Trim is embedded in the shell, not placed outside its bounding ellipsoid.
      for (const side of [-1, 1])
        box(
          group,
          mats.frame,
          [wb * 0.14, 0.025, 0.025],
          [wb * 0.2, a.radius + 0.25, side * p.wheelR * 0.57],
        );
      mergePart(group);
    }
  }
  if (p.luggageOn) {
    const group = part(root, "Luggage");
    if (a.scooter) {
      const center = [a.rearRail[0] - 0.025, a.seatY + 0.23, 0];
      tube(
        group,
        mats.chrome,
        a.rearRail,
        [center[0], center[1] - 0.11, 0],
        0.028,
      );
      box(group, mats.body, [wb * 0.28, 0.24, 0.32], center);
    } else {
      for (const side of [-1, 1]) {
        const anchor = [
          a.seatX - a.seatLength * 0.2,
          a.rearRail[1],
          side * a.railZ,
        ];
        const pos = [anchor[0], a.seatY - 0.13, side * (a.railZ + 0.22)];
        tube(group, mats.chrome, anchor, pos, 0.022);
        box(group, mats.seat, [wb * 0.27, 0.28, 0.2], pos);
      }
    }
    mergePart(group);
  }
  if (p.lightsOn) {
    const group = part(root, "Signals and tail lamp");
    const rearLamp = [a.rearRail[0] - 0.04, a.rearRail[1] + 0.045, 0];
    tube(group, mats.frame, a.rearRail, rearLamp, 0.026);
    box(group, mats.tail, [0.05, 0.07, 0.15], rearLamp);
    for (const side of [-1, 1]) {
      const frontBase = forkAt(0.82, side * 0.1);
      const rearBase = [a.rearRail[0], a.rearRail[1], side * a.railZ];
      for (const base of [frontBase, rearBase]) {
        const end = [base[0], base[1], side * (Math.abs(base[2]) + 0.09)];
        tube(group, mats.chrome, base, end, 0.013);
        box(group, mats.signal, [0.05, 0.045, 0.06], end);
      }
    }
    mergePart(group);
  }
}
