import { geoInterrupt, geoMollweideRaw } from "d3-geo-projection";

var lobes = [
  [
    // northern hemisphere
    [
      [-180, 0],
      [-90, 90],
      [0, 0],
    ],
    [
      [0, 0],
      [90, 90],
      [180, 0],
    ],
  ],
  [
    // southern hemisphere
    [
      [-180, 0],
      [-90, -90],
      [0, 0],
    ],
    [
      [0, 0],
      [90, -90],
      [180, 0],
    ],
  ],
];

export default function () {
  // prettier-ignore
  return geoInterrupt(geoMollweideRaw, lobes)
    .scale(169.529)
    .rotate([20, 0]);
}
