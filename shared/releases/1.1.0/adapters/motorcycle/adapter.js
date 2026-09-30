import { buildMotorcycle } from "./builder.js";
import {
  ARCHETYPES,
  SLIDERS,
  paramsFromSeed,
  getDerived,
  setDerived,
} from "./params.js";
import { STYLES } from "./styles.js";
import { schemaFromSamples } from "@engine/state.js";
const samples = Object.keys(ARCHETYPES).flatMap((key) =>
  [0, 1, 42, 12345, 4294967295].map((seed) => paramsFromSeed(seed, key)),
);
export const adapter = {
  id: "motorcycle",
  path: "low-poly-motorcycle-generator",
  label: "Low Poly Motorcycle",
  noun: "motorcycle",
  filePrefix: "bike",
  defaultLook: "studio",
  defaultType: null,
  colorKey: "body",
  colorLabel: "Hue",
  archetypes: ARCHETYPES,
  sliders: SLIDERS,
  styles: STYLES,
  paramsFromSeed,
  getDerived,
  setDerived,
  schema: schemaFromSamples(samples, SLIDERS),
  build: buildMotorcycle,
  materials: (style, params) => style.materials(params),
  paletteSlots: {
    body: "body",
    frame: "roof",
    chrome: "trim",
    rim: "accent",
    seat: "roof",
  },
  camera: {
    fov: 42,
    near: 0.05,
    far: 200,
    min: 1,
    max: 30,
    direction: [0.28, 0.25, 1],
  },
};
