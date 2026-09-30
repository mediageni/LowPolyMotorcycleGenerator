// Selectable visual styles: a rig (ground + lights with shadows), a background, and
// a material set for the low-poly motorcycle (paint, chrome, tyres, headlight…).

import * as THREE from "three";

import {
  col,
  std,
  groundPlane,
  gradientSky,
  sunRig,
} from "@engine/materials.js";

const rig = (options) =>
  sunRig({
    ...options,
    size: 120,
    extent: 6,
    near: 0.5,
    far: 30,
    hemiIntensity: 0.8,
    gridDivisions: 80,
    gridOpacity: 0.4,
    gridY: 0.005,
    roughness: 0.95,
  });

function mats(p, opts = {}) {
  return {
    body: std({ color: col(p.color.body), roughness: 0.42, metalness: 0.35 }),
    frame: std({
      color: opts.frame ?? 0x2a2d33,
      roughness: 0.5,
      metalness: 0.5,
    }),
    engine: std({
      color: opts.engine ?? 0x3b3f47,
      roughness: 0.55,
      metalness: 0.55,
    }),
    seat: std({ color: 0x161719, roughness: 0.8 }),
    tire: std({ color: 0x141619, roughness: 0.85 }),
    rim: std({ color: opts.rim ?? 0xc2cad2, roughness: 0.3, metalness: 0.6 }),
    chrome: std({
      color: opts.chrome ?? 0xd9dee4,
      roughness: 0.16,
      metalness: 0.9,
    }),
    glass: std({
      color: 0xfff3c4,
      emissive: 0xffe39a,
      emissiveIntensity: 0.7,
      roughness: 0.3,
    }),
  };
}

// --- Studio: clean neutral showroom (hero look) ------------------------------
const studio = {
  label: "Studio",
  background: new THREE.Color("#e9edf2"),
  exposure: 1.0,
  rig() {
    return rig({
      ground: 0xeef2f6,
      hemi: [0xffffff, 0xc4ccd4],
      sun: [-3, 6, 4],
      sunColor: 0xffffff,
      sunInt: 1.9,
      grid: [0xc0c8d0, 0xd8dee6],
    });
  },
  materials(p) {
    return mats(p);
  },
};

// --- Garage: warm concrete floor, daylight -----------------------------------
const garage = {
  label: "Garage",
  background: new THREE.Color("#3a3f47"),
  exposure: 1.05,
  rig() {
    return rig({
      ground: 0x4a4e55,
      hemi: [0xfff0d8, 0x35373c],
      sun: [-3, 6, 3],
      sunColor: 0xffe9c4,
      sunInt: 1.7,
      point: 0xffd9a0,
    });
  },
  materials(p) {
    return mats(p);
  },
};

// --- Neon: dark with a glowing grid (showroom at night) ----------------------
const neon = {
  label: "Neon",
  background: new THREE.Color("#0a0e1a"),
  exposure: 1.15,
  rig() {
    return rig({
      ground: 0x0c1018,
      hemi: [0x2a3a6a, 0x05080f],
      sun: [-3, 7, 4],
      sunColor: 0x9fb6e0,
      sunInt: 1.1,
      grid: [0x2de2e6, 0xff2a9d],
      point: 0x21d4fd,
    });
  },
  materials(p) {
    return mats(p, { rim: 0xdfe6ee, chrome: 0xe6edf4 });
  },
};

export const STYLES = { studio, garage, neon };
export const STYLE_KEYS = Object.keys(STYLES);
