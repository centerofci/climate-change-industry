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

import {
  keepBetween,
  groupBy,
  move,
  getAngleFromPoints,
  getPointFromAngleAndDistance,
  flatten,
  fromPairs,
  getSpiralPositions,
  sortBy,
  useChartDimensions,
} from "./../../utils";
import { types, typeColors } from "./../../constants";
import CircleText from "./../CircleText";
import NetworkTooltip from "./NetworkTooltip";
// import MissionsModal from "./MissionsModal";

import "./NetworkBubbles.css";

const NetworkBubbles = ({
  data,
  instruments,
  currentYear,
  groupType,
  groupMeta,
  searchTerm,
  hoveredType,
  hoveredStatus,
  focusedMission,
  onFocusMission,
}) => {
  const [ref, dms] = useChartDimensions();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const timeout = useRef();
  const simulation = useRef();
  const simulationData = useRef();
  const groups = useRef([]);
  const links = useRef([]);
  const cachedGroupPositions = useRef({});
  const forceUpdate = useForceUpdate();

  const groupSeparator = " -- ";

  useEffect(() => {
    cachedGroupPositions.current = {};
  }, [dms.width, dms.height]);

  useEffect(() => {
    if (!data) return;
    if (!dms.width) return;
    if (!groupMeta) return;
    // if (focusedMission) return;

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
      types.map((type) => data[type].map((d) => ({ ...d, type })))
    ).filter(
      (d) =>
        d["type"] == groupType ||
        initialLinks.find((link) => link["target"] == d["id"])
    );

    const baseCircleSize =
      (dms.width * dms.height * 0.0013) / (data[groupType].length + 30);
    // const spiralPositions = getSpiralPositions(
    //   nodes.length,
    //   baseCircleSize,
    //   Math.sqrt(baseCircleSize) * 1,
    //   Math.sqrt(baseCircleSize) * 0.56
    // );
    nodes = nodes.map((d, i) => {
      let cachedPosition = cachedGroupPositions.current[d["id"]];
      console.log(cachedPosition);
      if (!cachedPosition) cachedPosition = [dms.width / 2, dms.height / 2];
      return {
        ...d,
        // x: dms.width / 2 + spiralPositions[i].x,
        // y: dms.height / 2 + spiralPositions[i].y,
        x: cachedPosition[0],
        y: cachedPosition[1],
        r: d["type"] == groupType ? baseCircleSize * 1.5 : baseCircleSize * 0.6,
      };
    });
    console.log(initialLinks, nodes);

    links.current = initialLinks;
    simulationData.current = [...nodes];
    simulation.current = forceSimulation(simulationData.current)
      .force("x", forceX(dms.width / 2).strength(0.03))
      .force("y", forceY(dms.height / 2).strength(0.03))
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
  }, [dms.width, dms.height, data, groupType, currentYear, !!focusedMission]);
  useEffect(() => {}, [data]);

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
      setHoveredPoint(item);
    } else {
      timeout.current = setTimeout(() => {
        setHoveredPoint(null);
        timeout.current = null;
      }, 300);
    }
  };
  const updateModal = (d) => {
    onFocusMission(d["name"]);
  };

  const onCloseFocusedPoint = useCallback(() => {
    onFocusMission(null);
  }, []);

  const { topLeftDot } = useMemo(() => {
    if (!groups.current) return {};

    const topLeftDot = sortBy([...groups.current], (d) => d["x"] + d["y"])[0];
    return { topLeftDot };
  });

  const getNamesLabel = (names) =>
    names.split(groupSeparator).length > 2
      ? `${names.split(groupSeparator).length} ${groupMeta["pluralNoun"]}`
      : names.replace(new RegExp(groupSeparator, "g"), " & ");

  const truncate = (str, len = 23) =>
    str.length > len - 2 ? str.slice(0, len) + "..." : str;

  const getLinkPath = ({ source, target, type }) => {
    // let points = ["M", source.x, source.y];
    // if (type == "from") {
    //   points = ["M", source.x - 8, source.y, "L", source.x + 8, source.y];
    // } else if (type == "to") {
    //   points = [
    //     ...points,
    //     "L",
    //     target.x - 8,
    //     target.y,
    //     "L",
    //     target.x + 8,
    //     target.y,
    //   ];
    // }
    // points = [...points, "L", target.x, target.y];
    // return points.join(" ");
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

  return (
    <div
      ref={ref}
      className={`NetworkBubbles NetworkBubbles--${
        hoveredType || hoveredStatus || searchTerm ? "is" : "is-not"
      }-hovering`}
    >
      <div className="NetworkBubbles__wrapper">
        {groups.current && (
          <>
            {hoveredPoint && (
              <NetworkTooltip
                position={[
                  hoveredPoint["x"],
                  hoveredPoint["y"] - hoveredPoint["r"],
                ]}
                data={hoveredPoint}
                width={dms.width}
              />
            )}
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
                  Each dot is a mission
                  <br />
                  <i>hover to see details</i>
                </div>
              </div>
            )} */}
            <svg width={dms.width} height={dms.height}>
              <defs>
                {/* {groupType === "type" &&
                  groups.current.map(({ id, stops }) => (
                    <linearGradient id={`gradient-${id}`} key={id}>
                      {stops.map(({ color, start }, i) => (
                        <stop
                          key={i}
                          stopColor={color}
                          offset={start * 100 + "%"}
                        />
                      ))}
                    </linearGradient>
                  ))} */}
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

              {links.current.map((link, i) => (
                <path
                  key={i}
                  className={`NetworkBubbles__link NetworkBubbles__link--${link["type"]}`}
                  d={getLinkPath(link)}
                  markerStart={
                    link["type"] == "equal"
                      ? null
                      : "url(#NetworkBubbles__arrow)"
                  }
                ></path>
              ))}

              {groups.current.map((item) => (
                <g
                  key={item["id"]}
                  className={`NetworkBubbles__group-g`}
                  style={move(item["x"], item["y"])}
                >
                  {groupType == item["type"] && (
                    <CircleText r={item["r"] + 6}>
                      {truncate(item["label"], Math.floor(item["r"] * 0.36))}
                    </CircleText>
                  )}

                  <circle
                    className="NetworkBubbles__item"
                    style={{ fill: typeColors[item["type"]] }}
                    r={item["r"]}
                    onMouseEnter={() => {
                      console.log(item);
                      // const x =
                      //   item["x"] + nestedGroup["position"]["x"];
                      // const y =
                      //   item["y"] + nestedGroup["position"]["y"];
                      updateTooltip(item);
                    }}
                    onMouseLeave={() => updateTooltip(null)}
                    // onClick={() => updateModal(child)}
                  ></circle>
                </g>
              ))}
            </svg>
          </>
        )}
      </div>
      {/* {focusedMission && (
        <MissionsModal
          info={focusedMission}
          instruments={instruments}
          onClose={onCloseFocusedPoint}
        />
      )} */}
    </div>
  );
};

export default NetworkBubbles;

function useForceUpdate() {
  const [, setValue] = useState(0); // integer state
  return () => setValue((value) => ++value); // update the state to force render
}
