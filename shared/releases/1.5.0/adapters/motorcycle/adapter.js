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
import { std } from "@engine/materials.js";
import {
  enrichMotorcycle,
  MOTORCYCLE_SCHEMA,
  MOTORCYCLE_OPTIONS,
} from "./details.js";
const samples = Object.keys(ARCHETYPES).flatMap((key) =>
  [0, 1, 42, 12345, 4294967295].map((seed) => paramsFromSeed(seed, key)),
);
export const adapter = {
  id: "motorcycle",
  path: "low-poly-motorcycle-generator",
  label: "Motorcycle",
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
  schema: schemaFromSamples(samples, SLIDERS, MOTORCYCLE_SCHEMA),
  enrich: enrichMotorcycle,
  legacyConfig: (params) => params?.detailVersion === undefined,
  options: MOTORCYCLE_OPTIONS,
  optionsLabel: "Design & parts",
  firstType: "cafe",
  build: buildMotorcycle,
  materials: (style, params) => ({
    ...style.materials(params),
    screen: std({
      color: 0x9dbdcb,
      roughness: 0.3,
      transparent: true,
      opacity: 0.82,
    }),
    tail: std({ color: 0xa3302b, emissive: 0x4a100b, roughness: 0.5 }),
    signal: std({ color: 0xf3a13b, roughness: 0.4 }),
  }),
  paletteSlots: {
    body: "body",
    frame: "roof",
    chrome: "trim",
    rim: "accent",
    seat: "roof",
    screen: "glass",
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
