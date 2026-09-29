// Motorcycle parameters: type presets + seed -> params, URL (de)serialization.
// Pure data, no Three.js. These drive a REAL flat-shaded low-poly motorcycle
// (wheels + raked fork + frame + engine + tank + seat, reshaped per `form`).

import { makeRng, rng } from './rng.js';

const r2 = (v) => Math.round(v * 1000) / 1000;

// Defaults every type inherits; types override the distinctive bits.
const BASE = {
  form: 'cafe',                  // cruiser | sport | cafe | chopper | scrambler | scooter
  wheelbase: [1.32, 1.48],
  wheelR: [0.33, 0.39],
  rake: [0.22, 0.34],            // front-fork angle from vertical (radians)
  stance: [0.58, 0.7],           // seat/tank height above the wheel
};

export const ARCHETYPES = {
  cruiser:   { label: 'Cruiser', form: 'cruiser', wheelbase: [1.5, 1.72], wheelR: [0.34, 0.4],
               rake: [0.36, 0.5], stance: [0.5, 0.6] },
  sport:     { label: 'Sport', form: 'sport', wheelbase: [1.3, 1.42], wheelR: [0.32, 0.36],
               rake: [0.18, 0.28], stance: [0.68, 0.8] },
  cafe:      { label: 'Café Racer', form: 'cafe', wheelbase: [1.32, 1.46], wheelR: [0.33, 0.38],
               rake: [0.24, 0.32], stance: [0.6, 0.7] },
  chopper:   { label: 'Chopper', form: 'chopper', wheelbase: [1.7, 2.05], wheelR: [0.34, 0.42],
               rake: [0.5, 0.72], stance: [0.48, 0.58] },
  scrambler: { label: 'Scrambler', form: 'scrambler', wheelbase: [1.34, 1.5], wheelR: [0.36, 0.43],
               rake: [0.26, 0.36], stance: [0.66, 0.78] },
  scooter:   { label: 'Scooter', form: 'scooter', wheelbase: [1.05, 1.25], wheelR: [0.26, 0.32],
               rake: [0.2, 0.3], stance: [0.5, 0.6] },
};
export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

export const SLIDERS = [
  { key: 'wheelbase', label: 'Wheelbase', min: 1.0, max: 2.1, step: 0.02 },
  { key: 'wheelR',    label: 'Wheel size', min: 0.24, max: 0.45, step: 0.01 },
  { key: 'rake',      label: 'Fork rake', min: 0.1, max: 0.8, step: 0.02 },
  { key: 'stance',    label: 'Stance',    min: 0.4, max: 0.85, step: 0.02 },
];

function sample(r, spec) {
  if (Array.isArray(spec)) {
    if (spec.length === 2 && typeof spec[0] === 'number' && typeof spec[1] === 'number')
      return r2(rng.range(r, spec[0], spec[1]));
    return rng.pick(r, spec);
  }
  return spec;
}
const PARAM_KEYS = Object.keys(BASE);

export function paramsFromSeed(seed, archetype) {
  const r = makeRng(seed);
  const key = archetype && ARCHETYPES[archetype] ? archetype : rng.pick(r, ARCHETYPE_KEYS);
  const a = { ...BASE, ...ARCHETYPES[key] };
  const p = { seed: seed >>> 0, archetype: key };
  for (const k of PARAM_KEYS) p[k] = sample(r, a[k]);
  p.color = {
    body: { h: r2(r()), s: r2(rng.range(r, 0.5, 0.9)), l: r2(rng.range(r, 0.38, 0.55)) },
  };
  return p;
}

export function setDerived(p, key, value) { p[key] = value; }
export const getDerived = (p, key) => p[key];

export function encodeConfig(p) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/=+$/, ''); }
  catch { return ''; }
}
export function decodeConfig(str) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(str))));
    return p && typeof p === 'object' && p.color ? p : null;
  } catch { return null; }
}
