import React, { useEffect, useMemo, useState, useCallback } from "react";
import { max } from "d3-array";
import { scaleLog } from "d3-scale";

import { data } from "./../../constants";
import { fromPairs } from "./../../utils";
import Toggle from "../Toggle/Toggle";
import Icon from "../Icon/Icon";
import NetworkSearch from "./NetworkSearch";
import NetworkBubbles from "./NetworkBubbles";
import NetworkFilters from "./NetworkFilters";
import NetworkTooltip from "./NetworkTooltip";
import NetworkModal from "./NetworkModal";

import { contributionAreaColors, typeShapes } from "./../../constants";

import "./Network.css";

const Network = ({
  data,
  groupType,
  focusedItem,
  searchTerm,
  onChangeState,
}) => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [hoveredItem, onHoverItem] = useState(null);

  const groupMeta = groupOptionsById[groupType];

  const onFocusItem = useCallback((newItem) => {
    onChangeState("item", newItem);
  });

  const setSearchTerm = (newTerm) => {
    onChangeState("search", newTerm);
  };

  const onCloseFocusedItem = useCallback(() => {
    onFocusItem(null);
  }, []);

  return (
    <div className="Network__wrapper">
      <div className="Network__main">
        <div className="Network__sidebar">
          <div className="Network__sidebar__section Network__type">
            <div className="Network__toggle">
              {groupOptions.map(({ label, id }) => (
                <button
                  className={`Network__toggle__button Network__toggle__button--is-${
                    groupType == id ? "selected" : "unselected"
                  }`}
                  onClick={() => {
                    setActiveFilters([]);
                    onChangeState("group", id);
                  }}
                >
                  <svg viewBox="-75 -75 150 150">{typeShapes[id]}</svg>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="Network__sidebar__section Network__search">
            <NetworkSearch {...{ data, searchTerm, setSearchTerm }} />
          </div>
          <div className="Network__sidebar__section Network__filters">
            <NetworkFilters
              filters={groupMeta["filters"]}
              {...{ activeFilters }}
              data={data[groupType]}
              onUpdateFilters={setActiveFilters}
            />
          </div>
        </div>

        <div className="Network__bubbles">
          <NetworkBubbles
            {...{
              data,
              groupType,
              groupMeta,
              activeFilters,
              focusedItem,
              onFocusItem,
              hoveredItem,
              onHoverItem,
            }}
            searchTerm={searchTerm.toLowerCase()}
          />
        </div>
      </div>

      {!!hoveredItem && <NetworkTooltip data={hoveredItem} />}

      {focusedItem && (
        <NetworkModal info={focusedItem} onClose={onCloseFocusedItem} />
      )}
    </div>
  );
};

export default Network;

const amountSizeScale = scaleLog()
  .domain([1, max(data["Investments"], (d) => d["Amount"])])
  .range([0.01, 1.2])
  .clamp(true);

const groupOptions = [
  {
    label: "Interventions",
    id: "Interventions",
    pluralNoun: "interventions",
    key: "Interventions",
    accessor: (d) => d["Interventions"],
    clusterBy: "mainContributionArea",
    getClusterName: (d) => d["mainContributionArea"],
    getColor: (d) => contributionAreaColors[d["mainContributionArea"]],
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
    getColor: (d) => contributionAreaColors[d["mainContributionArea"]],
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
    getColor: (d) =>
      ({
        "Individual Person": "#89b792",
        Organization: "#4d405a",
      }[d["Person or Org"]]),
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
      d["Person or Org"] == "Individual Person"
        ? 1.3
        : ([
            "Under 10",
            "10-50",
            "50-100",
            "100-500",
            "500-1000",
            "1000+",
          ].indexOf(d["Number of People Involved (to 3 sig digits)"]) +
            8) *
          0.13,
    filters: [
      "mainContributionArea",
      "Enacting/Undertaking XYZ Interventions",
      "Entity Type",
      "Status",
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
const groupOptionsById = fromPairs(
  groupOptions.map((group) => [group["id"], group])
);
