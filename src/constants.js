import React from "react";
import { Group, Shape, Circle } from 'react-konva';
import rawData from "./data.json";
import { fromPairs } from "./utils";

export const types = ["Interventions", "Investments", "Actors"];

const getContributionArea = (d) => {
  return [
    ...new Set(d["Topical Contribution Area"].map((d) => d.split(":")[0])),
  ].sort();
  // .join(" & ");
};
export const data = fromPairs(
  types.map((type) => [
    type,
    rawData[type].map((d) => ({
      ...d,
      mainContributionArea: d["Topical Contribution Area"]
        ? getContributionArea(d)
        : null,
    })),
  ])
);

const colors = ["#4d405a", "#4d405a", "#4d405a", "#4d405a"];

export const accentColors = [
  "",
  "#afb9c5",
  "#008b94",
  "#5da17c",
  "#866fac",
]

let typeColors = {};
types.forEach((type, i) => {
  typeColors[type] = colors[i % colors.length];
});
export { typeColors };

export const contributionAreas = ["Mitigation", "Geoengineering", "Adaptation"];
// const contributionAreaColorsList = ["#89b792", "#4d405a", "#F79F1F"];
const contributionAreaColorsList = [
  accentColors[2],
  accentColors[3],
  accentColors[4],
];
let contributionAreaColors = {};
contributionAreas.forEach((contributionArea, i) => {
  contributionAreaColors[contributionArea] =
    contributionAreaColorsList[i % colors.length];
});
let contributionAreaColorCombos = [];
const handleCombo = (areaNames) => {
  const slug = areaNames.sort().join("--");
  contributionAreaColorCombos.push({
    slug,
    colors: areaNames.map((d) => contributionAreaColors[d]),
  });
  contributionAreaColors[slug] = `url(#${slug})`;
};
contributionAreas.forEach((contributionArea, i) => {
  contributionAreas.slice(i + 1).forEach((otherContributionArea) => {
    const areaNames = [contributionArea, otherContributionArea];
    handleCombo(areaNames);
  });
});
handleCombo(contributionAreas);
export { contributionAreaColors, contributionAreaColorCombos };

export const statusColors = {
  Active: "#89b792",
};

export const fieldLabels = {
  mainContributionArea: "Main contribution area",
  "Entity Type": "actor type",
};

export const sceneFunctionDrawShape = (path) => (context, shape) => {
  context.fillStrokeShape(shape)
  const path2D = new Path2D(path)
  context._context.stroke(path2D);
  context._context.fill(path2D);
}

export const typeShapes = {
  Interventions: {
    x: -50, y: -50, shapes: [
      "M50,5C25.2,5,5,25.2,5,50s20.2,45,45,45s45-20.2,45-45S74.8,5,50,5z M50,85c-19.3,0-35-15.7-35-35s15.7-35,35-35   s35,15.7,35,35S69.3,85,50,85z",
      "M50,20c-16.5,0-30,13.5-30,30s13.5,30,30,30s30-13.5,30-30S66.5,20,50,20z M50,70c-11,0-20-9-20-20s9-20,20-20s20,9,20,20   S61,70,50,70z",
      "M50,35c-8.3,0-15,6.7-15,15s6.7,15,15,15s15-6.7,15-15S58.3,35,50,35z M50,55c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5   S52.8,55,50,55z",
    ]
  },
  Investments: {
    x: -50, y: -50, shapes: [
      "M68.27,28.08H31.73S6.15,50,6.15,75.58c0,14.61,11,21.92,18.27,21.92H75.58c7.3,0,18.27-7.31,18.27-21.92C93.85,50,68.27,28.08,68.27,28.08ZM53.65,78.86v5.85h-7.3V78.88c-5.38-1-8.76-4.32-9-9.14h6.33c.31,2.53,2.86,4.16,6.55,4.16,3.4,0,5.81-1.65,5.81-4,0-2-1.56-3.14-5.4-4l-4.07-.87c-5.7-1.19-8.5-4.16-8.5-8.93s3.18-8.21,8.24-9.34V40.87h7.3v5.9c4.94,1.1,8.23,4.47,8.39,9H55.89c-.31-2.47-2.61-4.12-5.77-4.12s-5.44,1.52-5.44,3.9c0,1.93,1.49,3,5.16,3.82l3.77.8c6.29,1.32,9,4,9,8.89C62.61,74.29,59.25,77.79,53.65,78.86Z",
      "M68.27,6.15H58.17a11,11,0,0,0-16.34,0H31.73a3.66,3.66,0,0,0-3.39,5l3.39,9.61H68.27l3.39-9.61A3.66,3.66,0,0,0,68.27,6.15Z",
    ]
  },
  Actors: {
    x: -50, y: -50, shapes: [
      { x: 47.5, y: 30.028, r: 22.623, },
      "M68.213,49.752c-5.217,5.477-12.57,8.898-20.713,8.898s-15.496-3.422-20.713-8.898c-8.004,3.217-13.162,8.25-13.162,13.911   c0,9.712,15.166,23.932,33.875,23.932s33.875-14.22,33.875-23.932C81.375,58.002,76.217,52.969,68.213,49.752z"
    ]
  },
  Organizations: {
    x: -12.5, y: -12.5, scale: 4, shapes: [
      "M18,22 L22,22 L22,13 L18,13 L18,22 Z M13,10 L11,10 C10.447,10 10,9.552 10,9 C10,8.448 10.447,8 11,8 L13,8 C13.553,8 14,8.448 14,9 C14,9.552 13.553,10 13,10 L13,10 Z M13,14 L11,14 C10.447,14 10,13.552 10,13 C10,12.448 10.447,12 11,12 L13,12 C13.553,12 14,12.448 14,13 C14,13.552 13.553,14 13,14 L13,14 Z M13,18 L11,18 C10.447,18 10,17.552 10,17 C10,16.448 10.447,16 11,16 L13,16 C13.553,16 14,16.448 14,17 C14,17.552 13.553,18 13,18 L13,18 Z M2,22 L6,22 L6,8 L2,8 L2,22 Z M23,11 L22,11 L22,9 C22,8.448 21.553,8 21,8 C20.447,8 20,8.448 20,9 L20,11 L18,11 L18,4 C18,3.448 17.553,3 17,3 L13,3 L13,1 C13,0.448 12.553,0 12,0 C11.447,0 11,0.448 11,1 L11,3 L7,3 C6.447,3 6,3.448 6,4 L6,6 L4,6 L4,4 C4,3.448 3.553,3 3,3 C2.447,3 2,3.448 2,4 L2,6 L1,6 C0.447,6 0,6.448 0,7 L0,23 C0,23.552 0.447,24 1,24 L7,24 L17,24 L23,24 C23.553,24 24,23.552 24,23 L24,12 C24,11.448 23.553,11 23,11 L23,11 Z"
    ]
  },
  Regulations: {
    x: -50, y: -50, shapes: [
      { cx: 50, cy: 50, r: 50, },
      "M68.213,49.752c-5.217,5.477-12.57,8.898-20.713,8.898s-15.496-3.422-20.713-8.898c-8.004,3.217-13.162,8.25-13.162,13.911   c0,9.712,15.166,23.932,33.875,23.932s33.875-14.22,33.875-23.932C81.375,58.002,76.217,52.969,68.213,49.752z"
    ]
  },
};

export const relationships = {
  Interventions: "associated investments, funders, and actors",
  Investments: "source, recipient, and addressed interventions",
  Actors:
    "partners, associated organizations, funded & undertaken interventions, and made & received investments",
};

export const directions = {
  Interventions:
    "Hover or filter to isolate an intervention's primary connections, or click to see more details about an intervention.",
  Investments:
    "Hover or filter to isolate an investment's primary connections, or click to see more details about an investment.",
  Actors: "Select an actor to see its primary and secondary connections.",
};

export const contributionAreaDescriptions = {
  Mitigation: `climate interventions that reduce carbon (primarily) and other greenhouse gas emissions, either through reduction of production of emissions or through innovative techniques for emissions capture. This can be thought of as addressing the root causes.`,
  Adaptation: `climate interventions that take an active role in improving robustness and resiliency of habitats and occupants (humans, animals, plant life, etc.) in the face of climate changes (e.g. sea-level rise) and extreme weather. This can be thought of as preparing to ride-out the changes that are already coming, given the modeled levels of warming and expected climate consequences.`,
  Geoengineering: `human-engineered interventions, typically at a global or large ecosystem level (e.g. solar radiation management via introduction of atmospheric aerosols), to control or influence the Earth-climate system with the goal of reducing negative climate change impacts. This can be thought of as "clean-up control" or trying to partially reverse or reduce the impact of climate change; note there is considerable debate around how to define, scope and regulate geo-engineering, with many ethical and governance considerations to address. We anticipate that geoengineering tools will likely need to be among humanity's (thoughtfully considered) arrows in our climate-response quiver.`,
};
