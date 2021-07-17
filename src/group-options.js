import { max } from "d3-array";
import { scaleLog } from "d3-scale";

import { fromPairs } from "./utils";
import { data } from "./constants";

const amountSizeScale = scaleLog()
  .domain([1, max(data["Investments"], (d) => d["Amount"])])
  .range([0.01, 1.2])
  .clamp(true);

export const groupOptions = [
  {
    label: "Interventions",
    id: "Interventions",
    pluralNoun: "interventions",
    key: "Interventions",
    accessor: (d) => d["Interventions"],
    getSize: (d) => 0.8,
    clusterBy: "mainContributionArea",
    getClusterName: (d) => d["mainContributionArea"],
    // getColor: (d) => contributionAreaColors[d["mainContributionArea"]],
    filters: [
      "mainContributionArea",
      "Rate-Limiting Feature",
      "Type (approach)",
    ],
    links: [
      ["Associated Investments", "Investments", "equal"],
      ["Associated Regulations", "Regulations", "equal"],
      ["Enacted/Undertaken By", "Actors", "equal"],
      ["Funded by", "Actors", "equal"],
    ],
  },
  {
    label: "Investments",
    id: "Investments",
    pluralNoun: "investments",
    key: "Investments",
    accessor: (d) => d["Investments"],
    clusterBy: "mainContributionArea",
    getClusterName: (d) => d["mainContributionArea"],
    // getColor: (d) => contributionAreaColors[d["mainContributionArea"]],
    getSize: (d) => amountSizeScale(d["Amount"]) || 0.8,
    filters: ["mainContributionArea"],

    links: [
      ["Source", "Actors", "from"],
      ["Recipient", "Actors", "to"],
      ["Intervention(s) being addressed:", "Actors", "equal"],
    ],
  },
  {
    label: "Actors",
    id: "Actors",
    pluralNoun: "actors",
    key: "Actors",
    accessor: (d) => d["Actors"],
    // clusterBy: "Person or Org",
    // getClusterName: (d) => {
    //   return d["Person or Org"];
    // },
    // getColor: (d) =>
    //   ({
    //     "Individual Person": "var(--accent-3)",
    //     Organization: "var(--accent-2)",
    //   }[d["Person or Org"]]),
    // clusterBy: "Entity Type",
    // getClusterName: (d) => {
    //   return (d["Entity Type"] || [])[0];
    // },
    // getColor: (d) =>
    //   ({
    //     "Individual Person": "#89b792",
    //     Organization: "#4d405a",
    //   }[d]),
    getSize: (d) =>
      d.type != "Actors"
        ? 1.7
        : d["Person or Org"] == "Individual Person"
          ? 2.1
          : ([
            "Under 10",
            "10-50",
            "50-100",
            "100-500",
            "500-1000",
            "1000+",
          ].indexOf(d["Number of People Involved (to 3 sig digits)"]) +
            8) *
          0.23,
    filters: [
      // "mainContributionArea",
      // "Enacting/Undertaking XYZ Interventions",
      "Entity Type",
      // "Status",
    ],

    links: [
      [
        "Directly Associated Orgs (e.g., employment/parent org):",
        "Actors",
        "equal",
      ],
      ["Partners With", "Actors", "equal"],
      ["Enacting/Undertaking XYZ Interventions", "Interventions", "equal"],
      ["Funding XYZ Interventions", "Interventions", "to"],
      ["Made XYZ Investment(s)", "Investments", "to"],
      ["Received XYZ Investment(s)", "Investments", "from"],
    ],
  },
  // {
  //   label: "Regulations",
  //   id: "Regulations",
  //   pluralNoun: "regulations",
  //   key: "Regulations",
  //   accessor: (d) => d["Regulations"],
  //   links: [["Impacts the Following Interventions", "Interventions", "equal"]],
  // },
];
export const groupOptionsById = fromPairs(
  groupOptions.map((group) => [group["id"], group])
);
