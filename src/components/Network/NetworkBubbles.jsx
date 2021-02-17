import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  forceLink,
} from "d3-force";
import { polygonCentroid, polygonHull } from "d3";

import {
  keepBetween,
  truncate,
  move,
  getAngleFromPoints,
  getPointFromAngleAndDistance,
  flatten,
  fromPairs,
  getSpiralPositions,
  sortBy,
  useChartDimensions,
} from "./../../utils";
import {
  types,
  contributionAreaColors,
  contributionAreaColorCombos,
  typeShapes,
} from "./../../constants";
import CircleText from "./../CircleText";

import "./NetworkBubbles.css";

const NetworkBubbles = ({
  data,
  groupType,
  groupMeta,
  searchTerm,
  activeFilters,
  focusedItem,
  onFocusItem,
  hoveredItem,
  onHoverItem,
  focusedNode,
  setFocusedNodeId,
}) => {
  const [ref, dms] = useChartDimensions();
  const timeout = useRef();
  const simulationClusters = useRef();
  const simulationClustersData = useRef();
  const simulation = useRef();
  const simulationData = useRef();
  const tickIteration = useRef();
  const groups = useRef([]);
  const links = useRef([]);
  const cachedGroupPositions = useRef({});
  const forceUpdate = useForceUpdate();
  const clusterByKey = (groupMeta || {})["clusterBy"];
  const getClusterName =
    (groupMeta || {})["getClusterName"] || ((d) => d[clusterByKey]);
  const getColor = (d) =>
    contributionAreaColors[d["mainContributionArea"].sort().join("--")] ||
    "#888";
  const getSize = (groupMeta || {})["getSize"] || (() => 1);
  const fromColor = "#92C8C6";
  const toColor = "#EEA969";

  const baseCircleSize =
    (dms.width * dms.height * 0.001) / (data[groupType].length + 30);

  const { clusters, clusterPositions } = useMemo(() => {
    if (!data) return [];
    let groups = {};
    let clusters = [];
    if (!clusterByKey) {
      clusters = [
        {
          clusters: data[groupType].map((d) => ({
            ...d,
            name: "",
            group: 1,
            value: 10,
          })),
        },
      ];
    } else {
      data[groupType].forEach((d) => {
        let clusterName = getClusterName(d);
        if (clusterName && clusterName.length > 1) return;
        if (!groups[clusterName]) groups[clusterName] = [];
        groups[clusterName].push({
          ...d,
          group: clusterName,
          value: baseCircleSize * 70,
        });
      });
      Object.keys(groups).forEach((group) => {
        const items = groups[group];
        const count = items.length;
        const area = items.reduce((a, b) => (a.value || 0) + (b.value || 0), 0);
        clusters.push({
          name: group,
          count,
          r: Math.sqrt(area / Math.PI) * 1,
          items,
        });
      });
    }
    const numberOfGroups = clusters.length;

    const groupPositions = new Array(numberOfGroups)
      .fill(0)
      .map((_, i) =>
        getPointFromAngleAndDistance(
          (360 / numberOfGroups) * i + 180,
          baseCircleSize * 6
        )
      )
      .map((d, i) => ({
        ...d,
        ...clusters[i],
        x: d.x + dms.width / 2,
        y: d.y + dms.height / 2,
      }));

    simulationClustersData.current = [...groupPositions.map((d) => ({ ...d }))];
    simulationClusters.current = forceSimulation(simulationClustersData.current)
      .force(
        "x",
        forceX(dms.width / 2).strength(dms.width < dms.height ? 0.1 : 0.05)
      )
      .force(
        "y",
        forceY(dms.height / 2).strength(dms.width < dms.height ? 0.05 : 0.1)
      )
      .force(
        "collide",
        forceCollide((d) => d["r"] + baseCircleSize * 8)
      )
      .stop();
    new Array(60).fill(0).forEach(() => {
      simulationClusters.current.tick();
    });
    let clusterPositions = {};
    clusters.forEach(({ name }, i) => {
      clusterPositions[name] = [
        simulationClustersData.current[i].x,
        simulationClustersData.current[i].y,
      ];
    });
    return { clusters, clusterPositions };
  }, [data, dms.width + dms.height, groupMeta]);

  const getClusterPosition = (d = {}) => {
    const clusterName = getClusterName(d);
    if (clusterName && clusterName.length > 1) {
      const positions = clusterName
        .map((name) => clusterPositions[name])
        .filter((d) => d);
      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      return [avg(positions.map((d) => d[0])), avg(positions.map((d) => d[1]))];
    }
    const position = clusterPositions[clusterName];
    return position || [dms.width / 2, dms.height / 2];
  };

  useEffect(() => {
    cachedGroupPositions.current = {};
  }, [dms.width, dms.height]);

  useEffect(() => {
    if (!data) return;
    if (!dms.width) return;
    if (!groupMeta) return;
    // if (focusedItem) return;

    if (simulation.current) {
      simulation.current.stop();
    }

    const linkKeys = groupMeta["links"];

    let initialLinks = [];
    data[groupType].map((d) => {
      linkKeys.map(([key, tableName, typeOfLink]) => {
        const targetIds = d[key] || [];
        targetIds.forEach((targetId) => {
          const id = `${tableName}--${targetId}`;
          const target = data[tableName].find((d) => d["id"] == id);
          if (!target) return;
          initialLinks.push({
            source: d["id"],
            target: id,
            index: initialLinks.length,
            type: typeOfLink,
          });
        });
      });
    });

    let nodes = flatten(
      types.map((type) =>
        data[type].map((d) => ({ ...d, type, isMain: type == groupType }))
      )
    ).filter(
      (d) =>
        d["type"] == groupType ||
        initialLinks.find((link) => link["target"] == d["id"])
    );

    // const spiralPositions = getSpiralPositions(
    //   nodes.length,
    //   baseCircleSize,
    //   Math.sqrt(baseCircleSize) * 1,
    //   Math.sqrt(baseCircleSize) * 0.56
    // );

    const getId = (d) => (typeof d == "object" ? d["id"] : d);
    const getMatches = (d = {}) => {
      if (!d) return [];
      let links = initialLinks.filter(
        (link) =>
          getId(link["target"]) == d["id"] || getId(link["source"]) == d["id"]
      );
      // grab the investment targets as well
      const investments = new Set(
        links
          .map((d) => getId(d["target"]))
          .filter((d) => d.startsWith("Investments--"))
      );

      links = [
        ...links,
        ...initialLinks.filter(
          (link) =>
            investments.has(getId(link["target"])) ||
            investments.has(getId(link["source"]))
        ),
      ];
      return links;
    };
    const getMatchTypes = (d) => {
      const matches = initialLinks.filter((link) => link["target"] == d["id"]);
      return [...new Set(matches.map((d) => d["type"]))].sort();
    };

    nodes = nodes
      .map((d, i) => {
        let cachedPosition = cachedGroupPositions.current[d["id"]];
        if (!cachedPosition)
          cachedPosition = d.clusterPosition || [dms.width / 2, dms.height / 2];
        const matchTypes = getMatchTypes(d).join("--");
        const color = d.isMain ? getColor(d) : "var(--accent-1)";
        const clusterPosition = getClusterPosition(d);
        // {
        //     from: fromColor,
        //     to: toColor,
        //     "from--to": "url(#from-to)",
        //   }[matchTypes] || "#95afc0";
        return {
          ...d,
          // x: dms.width / 2 + spiralPositions[i].x,
          // y: dms.height / 2 + spiralPositions[i].y,
          x: cachedPosition[0],
          y: cachedPosition[1],
          r:
            (d["type"] == groupType
              ? baseCircleSize * 1.5
              : baseCircleSize * 0.7) * getSize(d),
          numberOfLinks: getMatches(d).length,
          color,
          matchTypes,
          clusterPosition,
          x: clusterPosition[0],
          y: clusterPosition[1],
        };
      })
      .sort((a, b) => b.numberOfLinks - a.numberOfLinks);
    nodes = nodes.map((node) => ({
      ...node,
      linkedNodeIds: node.isMain
        ? []
        : [
            ...new Set(
              getMatches(node).map(
                (d) => [d.source, d.target].filter((d) => d != node.id)[0]
              )
            ),
          ],
    }));

    const newFocusedNode = focusedNode || nodes.find((d) => d.isMain);
    if (!hoveredItem && groupType == "Actors") {
      onHoverItem(newFocusedNode);
    }
    setFocusedNodeId(newFocusedNode["id"]);

    // filter to just 2nd & 3rd relatives
    if (groupType == "Actors") {
      const matchingLinks = getMatches(newFocusedNode);
      const matchingIds = new Set([
        ...matchingLinks.map((d) => d["source"]),
        ...matchingLinks.map((d) => d["target"]),
      ]);
      const nextLevelMatchingLinks = initialLinks.filter(
        (link) => matchingIds.has(link.target) || matchingIds.has(link.source)
      );
      const nextLevelMatchingIds = new Set([
        ...nextLevelMatchingLinks.map((d) => d["source"]),
        ...nextLevelMatchingLinks.map((d) => d["target"]),
      ]);
      const getDistanceFromFocusedNode = (d) =>
        d.id == newFocusedNode.id ? 0 : matchingIds.has(d.id) ? 1 : 2;
      const isAttachedToFocusedNode = (d) => nextLevelMatchingIds.has(d);
      nodes = nodes
        .filter((d) => isAttachedToFocusedNode(d["id"]))
        .map((d) => ({ ...d, distance: getDistanceFromFocusedNode(d) }));
      initialLinks = initialLinks.filter(
        (link) =>
          isAttachedToFocusedNode(link["source"]) &&
          isAttachedToFocusedNode(link["target"])
      );
    }

    tickIteration.current = 0;
    links.current = [...initialLinks];
    simulationData.current = [...nodes];
    simulation.current = forceSimulation(simulationData.current)
      .force(
        "x",
        forceX((d) => d.clusterPosition[0]).strength(
          groupType == "Actors" ? 0.3 : (d) => (d.isMain ? 0.2 : 0)
        )
      )
      .force(
        "y",
        forceY(
          (d) =>
            d.clusterPosition[1] +
            (d.matchTypes == "from" ? -30 : d.matchTypes == "to" ? 30 : 0)
        ).strength(groupType == "Actors" ? 0.3 : (d) => (d.isMain ? 0.2 : 0))
      )
      .force(
        "link",
        forceLink(links.current)
          .id((d) => d["id"])
          .distance(baseCircleSize * 2.6)
          .strength(0.4)
      )
      .force(
        "collide",
        forceCollide(
          (d) =>
            d["r"] +
            baseCircleSize *
              (groupType == "Actors" ? 3 : 1.2) *
              (d.isMain ? 1.3 : 0.6)
        )
          .strength(0.7)
          // .iterations(groupType == "Actors" ? 10 : 6)
          .iterations(1)
      )
      .alphaMin(0.001)
      .alpha(groupType == "Actors" ? 0.1 : 1)
      .on("tick", onTick);
  }, [
    dms.width,
    dms.height,
    data,
    groupType,
    // !!focusedItem,
    groupType == "Actors" ? focusedNode : "",
  ]);

  useEffect(() => {
    if (groupType != "Actors") return;
    if (!focusedNode) return;
    onHoverItem(focusedNode);
  }, [groupType == "Actors" ? focusedNode : ""]);

  const groupBubbles =
    groupType == "Actors"
      ? []
      : clusters.map(({ name, items = [] }) => {
          const position = getClusterPosition(items[0]);
          if (!position) return [];
          const points = groups.current
            .filter((d) => getClusterName(d) == name && d.isMain)
            .map((d) => [d.x, d.y]);
          let hull = polygonHull(points) || [];
          if (!hull.length) hull = points;
          const top = [
            keepBetween(
              points.map((d) => d[0]).reduce((a, b) => a + b, 0) /
                points.length,
              50,
              dms.width - 50
            ),
            keepBetween(
              Math.min(...points.map((d) => d[1])) - baseCircleSize * 5,
              10,
              dms.height - 10
            ),
          ];
          return {
            name,
            path: hull.length
              ? "M" + hull.map((d) => d.join(" ")).join(" L ") + "Z"
              : "",
            top,
            position,
          };
        });

  function onTick(d) {
    const padding = 20;
    let secondaryNodesOnNodeRunningCount = {};
    const numberOfPositions = 5;
    const spiralPositions = new Array(numberOfPositions)
      .fill(0)
      .map((_, i) =>
        getPointFromAngleAndDistance(
          (360 / numberOfPositions) * i,
          baseCircleSize * 2
        )
      );
    simulationData.current.forEach((d) => {
      d["x"] = keepBetween(
        d["x"],
        d["r"] + padding,
        dms.width - d["r"] - padding
      );
      d["y"] = keepBetween(
        d["y"],
        d["r"] + padding,
        dms.height - d["r"] - padding
      );
      if (groupType != "Actors" && tickIteration.current < 20 && !d.isMain) {
        let position = [dms.width / 2, dms.height / 2];
        const linkedNodes = d.linkedNodeIds.map((link) =>
          simulationData.current.find((d) => d.id == link)
        );

        if (linkedNodes.length > 1) {
          position = polygonCentroid(linkedNodes.map((d) => [d.x, d.y]));
        }
        if (linkedNodes.length == 1 || Number.isNaN(position[0])) {
          let linkedId = linkedNodes[0].id;
          if (!secondaryNodesOnNodeRunningCount[linkedId])
            secondaryNodesOnNodeRunningCount[linkedId] = 0;
          const spiralPosition =
            spiralPositions[
              secondaryNodesOnNodeRunningCount[linkedId] %
                spiralPositions.length
            ];
          position = [
            linkedNodes[0].x + spiralPosition.x,
            linkedNodes[0].y + spiralPosition.y,
          ];
          secondaryNodesOnNodeRunningCount[linkedId]++;
        }
        d["x"] = position[0];
        d["y"] = position[1];
      }
    });
    groups.current = simulationData.current;

    cachedGroupPositions.current = {
      ...cachedGroupPositions.current,
      ...fromPairs(
        groups.current.map((item) => [item["id"], [item["x"], item["y"]]])
      ),
    };
    tickIteration.current++;

    forceUpdate();
    // setGroups(simulationData.current);
  }

  const updateTooltip = (item) => {
    if (item) {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      onHoverItem(item);
    } else {
      timeout.current = setTimeout(() => {
        onHoverItem(null);
        timeout.current = null;
      }, 300);
    }
  };

  const getLinkPath = ({ source, target, type }) => {
    const angle = getAngleFromPoints(source, target);
    const reverseAngle = getAngleFromPoints(target, source);
    const startDiff = getPointFromAngleAndDistance(angle, source.r + 2);
    const targetDiff = getPointFromAngleAndDistance(reverseAngle, target.r + 2);
    let points = [
      [source.x - startDiff.x, source.y - startDiff.y],
      [target.x - targetDiff.x, target.y - targetDiff.y],
    ];
    if (type == "to") points.reverse();
    return `M ${points[0].join(" ")} L ${points[1].join(" ")}`;
  };

  const isInHoveredPointNetwork = (item, source) => {
    if (item.id == hoveredItem.id) return 1;
    const inNetworkMatches = links.current.filter(
      (d) => d.source.id == hoveredItem.id || d.target.id == hoveredItem.id
    );
    const doesHaveAMatch = !!inNetworkMatches.find(
      (d) =>
        (d.target.id == item.id || d.source.id == item.id) &&
        (!source || d.source.id == source.id)
    );
    return doesHaveAMatch ? 0.9 : 0.13;
  };

  const getItemOpacity = (item, source = null) => {
    if (searchTerm)
      return item.label.toLowerCase().includes(searchTerm) ? 1 : 0.13;
    if (Number.isFinite(item.distance)) {
      return [1, 0.9, 0.3][item.distance];
    }
    if (hoveredItem) return isInHoveredPointNetwork(item, source);
    if (!activeFilters.length) return 1;

    const unsatisifiedActiveFilters = activeFilters.filter(
      ({ type, value: filterValue }) => {
        const value = getFilterFromItem(item, type);
        if (!value.length) return true;
        if (source) {
          const sourceValue = getFilterFromItem(source, type);
          if (!sourceValue.includes(filterValue)) return true;
          return false;
        }
        if (value.includes(filterValue)) return false;
        return true;
      }
    );
    return unsatisifiedActiveFilters.length ? 0.13 : 1;
  };

  return (
    <div
      ref={ref}
      className={`NetworkBubbles NetworkBubbles--${
        activeFilters.length || searchTerm ? "is" : "is-not"
      }-hovering`}
    >
      <div className="NetworkBubbles__wrapper">
        {groups.current && (
          <>
            {/* {topLeftDot && (
              <div
                className="NetworkBubbles__annotation"
                style={move(
                  topLeftDot["position"][0] + topLeftGroup["x"],
                  topLeftDot["position"][1] + topLeftGroup["y"]
                )}
              >
                <svg
                  className="NetworkBubbles__annotation-line"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    d="M 0 0 C 0 0.5 0.5 1 1 1"
                  ></path>
                </svg>
                <div className="NetworkBubbles__annotation-text">
                  Each dot is a Item
                  <br />
                  <i>hover to see details</i>
                </div>
              </div>
            )} */}
            <svg width={dms.width} height={dms.height}>
              <defs>
                <linearGradient id={`from-to`}>
                  {[fromColor, toColor].map((color, i) => (
                    <stop key={i} stopColor={color} offset={i * 100 + "%"} />
                  ))}
                </linearGradient>

                {contributionAreaColorCombos.map(({ slug, colors }) => (
                  <linearGradient key={slug} id={slug}>
                    {colors.map((color, i) => (
                      <stop key={i} stopColor={color} offset={i * 100 + "%"} />
                    ))}
                  </linearGradient>
                ))}

                <marker
                  id="NetworkBubbles__arrow"
                  className="NetworkBubbles__arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="12"
                  markerHeight="12"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 6 5 L 0 9 z" />
                </marker>

                <filter
                  id="noise"
                  x={-dms.width}
                  y={-dms.height}
                  // width="600%"
                  // height="600%"
                  width={dms.width * 2}
                  height={dms.height * 2}
                >
                  <feTurbulence
                    baseFrequency="0.03 0.03"
                    result="NOISE"
                    numOctaves="2"
                  ></feTurbulence>
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="NOISE"
                    scale="13"
                    xChannelSelector="R"
                    yChannelSelector="R"
                  ></feDisplacementMap>
                </filter>
              </defs>

              {groupBubbles.map(({ name, path, top }, i) => (
                <path
                  key={name}
                  className={`NetworkBubbles__cluster`}
                  style={{ strokeWidth: baseCircleSize * 7 }}
                  filter="url(#noise)"
                  d={path}
                ></path>
              ))}

              {links.current.map((link, i) => (
                <g key={i}>
                  <path
                    className={`NetworkBubbles__link NetworkBubbles__link--${link["type"]}`}
                    d={getLinkPath(link)}
                    markerStart={
                      link["type"] == "equal"
                        ? null
                        : "url(#NetworkBubbles__arrow)"
                    }
                    style={{
                      opacity: getItemOpacity(link.target, link.source),
                    }}
                  ></path>
                  {link["type"] != "equal" && (
                    <path
                      className={`NetworkBubbles__link__pulse NetworkBubbles__link__pulse--${link["type"]}`}
                      d={getLinkPath(link)}
                      style={{
                        opacity: getItemOpacity(link.target, link.source),
                      }}
                    ></path>
                  )}
                </g>
              ))}

              {groups.current.map((item) => (
                <g
                  key={item["id"]}
                  className={`NetworkBubbles__group-g`}
                  style={{
                    ...move(item["x"], item["y"]),
                    opacity: getItemOpacity(item),
                  }}
                  onClick={() =>
                    groupType == "Actors"
                      ? setFocusedNodeId(item["id"])
                      : onFocusItem(item["id"])
                  }
                >
                  <g
                    onMouseEnter={() => updateTooltip(item)}
                    onMouseLeave={() =>
                      groupType == "Actors"
                        ? updateTooltip(focusedNode)
                        : updateTooltip(null)
                    }
                  >
                    <circle
                      fill={
                        groupType == "Actors" &&
                        item["id"] == (focusedNode || {})["id"]
                          ? "white"
                          : "transparent"
                      }
                      r={item["r"] * 1.6}
                    />
                    <g
                      style={{
                        // fill: typeColors[item["type"]],
                        fill: item["color"],
                        transform: `scale(${item["r"] / 50})`,
                      }}
                    >
                      {item["type"] == "Actors" &&
                      item["Person or Org"] == "Organization"
                        ? typeShapes["Organizations"]
                        : typeShapes[item["type"]]}
                    </g>
                  </g>

                  {groupType == item["type"] && (
                    <CircleText r={item["r"] + 6}>
                      {truncate(item["label"], Math.floor(item["r"] * 0.36))}
                    </CircleText>
                  )}
                </g>
              ))}

              {groupBubbles.map(({ name, path, top }, i) => (
                <text
                  key={name}
                  style={move(...top)}
                  className={`NetworkBubbles__cluster-name`}
                >
                  {name}
                </text>
              ))}
            </svg>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkBubbles;

function useForceUpdate() {
  const [, setValue] = useState(0); // integer state
  return () => setValue((value) => ++value); // update the state to force render
}

const getFilterFromItem = (d, filter) => {
  const value = d[filter];
  if (!value) return [];
  if (typeof value == "object") return value;
  return [value];
};
