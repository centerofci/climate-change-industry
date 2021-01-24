import React, { useEffect, useMemo, useState, useCallback } from "react";
import { max } from "d3-array";
import { scaleLog } from "d3-scale";

import data from "./../../data.json";
import { fromPairs, useInterval } from "./../../utils";
import Toggle from "../Toggle/Toggle";
import Icon from "../Icon/Icon";
// import NetworkSearch from "./NetworkSearch";
// import NetworkTimeline from "./NetworkTimeline";
import NetworkBubbles from "./NetworkBubbles";
// import NetworkLegend from "./NetworkLegend";

import { contributionAreaColors, typeColors } from "./../../constants";

import "./Network.css";

const Network = ({
  data,
  instruments,
  initialYear,
  groupType,
  focusedMission,
  searchTerm,
  onChangeState,
}) => {
  const [hoveredType, setHoveredType] = useState(null);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [currentYear, setCurrentYear] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // useEffect(() => {
  //   if (isPlaying) return;
  //   onChangeState("year", currentYear);
  // }, [currentYear]);

  // useEffect(() => {
  //   if (isPlaying) {
  //     onChangeState("year", null);
  //   } else {
  //     onChangeState("year", currentYear);
  //   }
  // }, [isPlaying]);

  // const yearRange = useMemo(() => {
  //   if (!data) return;
  //   const yearRange = extent(data["Actors"], (d) => d["year"]);
  //   if (Number.isFinite(initialYear)) {
  //     setCurrentYear(initialYear);
  //     setIsPlaying(false);
  //   } else if (focusedMission) {
  //     setIsPlaying(false);
  //   } else {
  //     setCurrentYear(yearRange[0]);
  //     // setCurrentYear(2020);
  //     // setIsPlaying(true);
  //   }
  //   return yearRange;
  // }, [data]);

  // const didFinishPlaying = currentYear === (yearRange || [])[1];
  // const onToggleIsPlaying = () => {
  //   if (didFinishPlaying && !isPlaying) {
  //     setCurrentYear(yearRange[0]);
  //   }
  //   onChangeState("year", currentYear);
  //   setIsPlaying(!isPlaying);
  // };

  // useInterval(
  //   () => {
  //     if (currentYear >= yearRange[1]) {
  //       setIsPlaying(false);
  //       return;
  //     }
  //     setCurrentYear(currentYear + 1);
  //   },
  //   isPlaying ? 300 : null
  // );

  // const onSetYear = (year) => {
  //   setCurrentYear(year);
  //   setIsPlaying(false);
  // };

  const groupMeta = groupOptionsById[groupType];

  const onLegendItemHover = useCallback((type, item) => {
    if (!type) {
      setHoveredStatus(null);
      setHoveredType(null);
    } else if (type === "status") {
      setHoveredType(null);
      setHoveredStatus(item);
    } else {
      setHoveredType(item);
      setHoveredStatus(null);
    }
  }, []);
  // console.log({ groupType });

  const onFocusItem = useCallback((newItem) => {
    onChangeState("item", newItem);
  });

  const setSearchTerm = (newTerm) => {
    onChangeState("search", newTerm);
  };

  return (
    <div className="Network__wrapper">
      <div className="Network__controls">
        {/* <button className="Network__button" onClick={onToggleIsPlaying}>
          <Icon
            name={isPlaying ? "pause" : didFinishPlaying ? "refresh" : "play"}
          />
        </button>
        <div className="Network__current-year">{currentYear}</div> */}
        <div className="Network__toggle">
          <h6>Group by</h6>
          <Toggle
            options={groupOptions}
            value={groupType}
            onChange={(newValue) => onChangeState("group", newValue)}
          />
        </div>
      </div>

      {/* <div className="Network__timeline">
        <NetworkTimeline
          {...{ currentYear, yearRange }}
          onChange={onSetYear}
        />
      </div> */}

      <div className="Network__bubbles">
        <NetworkBubbles
          {...{
            data,
            instruments,
            currentYear,
            groupType,
            groupMeta,
            hoveredType,
            hoveredStatus,
            focusedMission,
            onFocusItem,
          }}
          searchTerm={searchTerm.toLowerCase()}
        />
      </div>

      <div className="Network__search">
        {/* <NetworkSearch {...{ data, searchTerm, setSearchTerm }} /> */}
      </div>
      {/* <NetworkLegend
        {...{ hoveredType, hoveredStatus }}
        onItemHover={onLegendItemHover}
      /> */}
    </div>
  );
};

export default Network;

const getContributionArea = (d) => {
  return [
    ...new Set(d["Topical Contribution Area"].map((d) => d.split(":")[0])),
  ].join("--");
};
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
    clusterBy: "Topical Contribution Area",
    getClusterName: getContributionArea,
    getColor: (d) => contributionAreaColors[getContributionArea(d)],
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
    clusterBy: "Topical Contribution Area",
    getClusterName: getContributionArea,
    getColor: (d) => contributionAreaColors[getContributionArea(d)],
    getSize: (d) => amountSizeScale(d["Amount"]) || 0.8,
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
      ([
        "Individual",
        "Under 10",
        "10-50",
        "50-100",
        "100-500",
        "500-1000",
        "1000+",
      ].indexOf(d["Number of People Involved (to 3 sig digits)"]) +
        8) *
      0.13,
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
  {
    label: "Regulations",
    id: "Regulations",
    pluralNoun: "regulations",
    key: "Regulations",
    accessor: (d) => d["Regulations"],
    links: [["Impacts the Following Interventions", "Interventions", "equal"]],
  },
].map((d) => ({ ...d, color: typeColors[d.id] }));
const groupOptionsById = fromPairs(
  groupOptions.map((group) => [group["id"], group])
);
