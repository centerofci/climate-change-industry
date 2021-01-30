import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  forceLink,
} from "d3-force";
import { polygonHull } from "d3";

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
import { types, typeColors, typeShapes } from "./../../constants";
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
}) => {
  const [ref, dms] = useChartDimensions();
  const timeout = useRef();
  const simulation = useRef();
  const simulationData = useRef();
  const groups = useRef([]);
  const links = useRef([]);
  const cachedGroupPositions = useRef({});
  const forceUpdate = useForceUpdate();
  const clusterByKey = (groupMeta || {})["clusterBy"];
  const getClusterName =
    (groupMeta || {})["getClusterName"] || ((d) => d[clusterByKey]);
  const getColor = (groupMeta || {})["getColor"] || ((d) => "#888");
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
        if (!groups[clusterName]) groups[clusterName] = [];
        groups[clusterName].push({ ...d, group: clusterName, value: 10 });
      });
      Object.keys(groups).forEach((group) => {
        const items = groups[group];
        const count = items.length;
        const area = items.reduce((a, b) => (a.value || 0) + (b.value || 0), 0);
        clusters.push({
          name: group,
          count,
          r: Math.sqrt(area / Math.PI),
          items,
        });
      });
    }
    const numberOfGroups = clusters.length;
    const groupPositions =
      {
        1: [[dms.width / 2, dms.height / 2]],
        2: [
          [dms.width / 5, dms.height / 2],
          [(dms.width / 5) * 4, dms.height / 2],
        ],
        3: [
          [dms.width / 3, (dms.height / 3) * 2],
          [(dms.width / 3) * 2, dms.height / 3],
          [(dms.width / 3) * 2, (dms.height / 3) * 2],
        ],
      }[numberOfGroups] ||
      getSpiralPositions(numberOfGroups, baseCircleSize * 3, 10, 4).map((d) => [
        d.x + dms.width / 2,
        d.y + dms.height / 2,
      ]);
    let clusterPositions = {};
    clusters.forEach(({ name }, i) => {
      clusterPositions[name] = groupPositions[i] || [0, 0];
    });
    return { clusters, clusterPositions };
  }, [data, dms.width + dms.height, groupMeta]);

  const getClusterPosition = (d = {}) => {
    const clusterName = getClusterName(d);
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

    const getTertiaryBubbleColor = (d) => {
      const matches = initialLinks.filter((link) => link["target"] == d["id"]);
      const matchTypes = [...new Set(matches.map((d) => d["type"]))]
        .sort()
        .join("--");
      return (
        {
          from: fromColor,
          to: toColor,
          "from--to": "url(#from-to)",
        }[matchTypes] || "#95afc0"
      );
    };

    nodes = nodes.map((d, i) => {
      let cachedPosition = cachedGroupPositions.current[d["id"]];
      if (!cachedPosition) cachedPosition = [dms.width / 2, dms.height / 2];
      return {
        ...d,
        // x: dms.width / 2 + spiralPositions[i].x,
        // y: dms.height / 2 + spiralPositions[i].y,
        x: cachedPosition[0],
        y: cachedPosition[1],
        r:
          (d["type"] == groupType
            ? baseCircleSize * 1.5
            : baseCircleSize * 0.6) * getSize(d),
        color: d.isMain ? getColor(d) : getTertiaryBubbleColor(d),
      };
    });

    links.current = initialLinks;
    simulationData.current = [...nodes];
    simulation.current = forceSimulation(simulationData.current)
      .force(
        "x",
        forceX((d) => getClusterPosition(d)[0]).strength(
          groupType == "Actors" ? 0.03 : (d) => (d.isMain ? 0.8 : 0)
        )
      )
      .force(
        "y",
        forceY((d) => getClusterPosition(d)[1]).strength(
          groupType == "Actors" ? 0.03 : (d) => (d.isMain ? 0.8 : 0)
        )
      )
      .force(
        "link",
        forceLink(links.current)
          .id((d) => d["id"])
          .distance(baseCircleSize)
          .strength(0.9)
      )
      .force(
        "collide",
        forceCollide((d) => d["r"] + dms.width * 0.02).strength(0.6)
      )
      .alphaMin(0.001)
      .on("tick", onTick);
  }, [dms.width, dms.height, data, groupType, !!focusedItem]);
  useEffect(() => {}, [data]);

  const groupBubbles = clusters.map(({ name, items = [] }) => {
    const position = getClusterPosition(items[0]);
    if (!position) return [];
    const points = groups.current
      .filter((d) => getClusterName(d) == name && d.isMain)
      .map((d) => [d.x, d.y]);
    let hull = polygonHull(points) || [];
    if (!hull.length) hull = points;
    const top = [
      keepBetween(
        points.map((d) => d[0]).reduce((a, b) => a + b, 0) / points.length,
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
      path: "M" + hull.map((d) => d.join(" ")).join(" L ") + "Z",
      top,
      position,
    };
  });

  function onTick(d) {
    const padding = 20;
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
    });
    groups.current = simulationData.current;

    cachedGroupPositions.current = {
      ...cachedGroupPositions.current,
      ...fromPairs(
        groups.current.map((item) => [item["id"], [item["x"], item["y"]]])
      ),
    };
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
  const updateModal = (d) => {
    onFocusItem(d["name"]);
  };

  // const { topLeftDot } = useMemo(() => {
  //   if (!groups.current) return {};

  //   const topLeftDot = sortBy([...groups.current], (d) => d["x"] + d["y"])[0];
  //   return { topLeftDot };
  // });

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
              </defs>

              {groupBubbles.map(({ name, path, top }, i) => (
                <path
                  key={name}
                  className={`NetworkBubbles__cluster`}
                  style={{ strokeWidth: baseCircleSize * 7 }}
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
                  onClick={() => onFocusItem(item.id)}
                >
                  <g
                    onMouseEnter={() => updateTooltip(item)}
                    onMouseLeave={() => updateTooltip(null)}
                    style={{
                      // fill: typeColors[item["type"]],
                      fill: item["color"],
                      transform: `scale(${item["r"] / 50})`,
                    }}
                  >
                    <circle fill="transparent" r={item["r"]} />
                    {item["type"] == "Actors" &&
                    item["Person or Org"] == "Organization"
                      ? typeShapes["Organizations"]
                      : typeShapes[item["type"]]}
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
