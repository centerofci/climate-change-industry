import React from "react";
import { format } from "d3";

import { move, truncate } from "./../../utils";
import { typeColors } from "./../../constants";

import "./NetworkTooltip.css";

const NetworkTooltip = ({ position, data, width }) => {
  const verticalPosition = position[1] < 200 ? "bottom" : "top";
  const horizontalPosition =
    position[0] < 100 ? "right" : position[0] > width - 100 ? "left" : "normal";

  return (
    <div
      className={[
        "NetworkTooltip",
        `NetworkTooltip--vertical-${verticalPosition}`,
        `NetworkTooltip--horizontal-${horizontalPosition}`,
      ].join(" ")}
      style={move(
        `calc(${
          horizontalPosition === "left"
            ? -100
            : horizontalPosition === "right"
            ? 0
            : -50
        }% + ${position[0]}px)`,
        `calc(${verticalPosition === "top" ? -100 : 0}% + ${position[1]}px)`,
        true
      )}
    >
      <div className="NetworkTooltip__name">
        {truncate(data["label"], 30)}
        {!!data["year"] && (
          <div className="NetworkTooltip__year">{data["year"]}</div>
        )}
      </div>
      <div className="NetworkTooltip__text">{data["type"].slice(0, -1)}</div>
      {data["Amount"] && (
        <div className="NetworkTooltip__text">
          ${format(",.0f")(data["Amount"])}
        </div>
      )}
      {data["Topical Contribution Area"] && (
        <div className="NetworkTooltip__text">
          {data["Topical Contribution Area"]}
        </div>
      )}
      {data["Entity Type"] && (
        <div className="NetworkTooltip__text">
          {data["Entity Type"].join(", ")}
        </div>
      )}
      {data["Focus"] && (
        <div className="NetworkTooltip__text">{data["Focus"]}</div>
      )}
      {/* <div className="NetworkTooltip__info ">
        <span className={`NetworkTooltip__info actor actor--${data["actor"]}`}>
          {data["actors"].join(", ").replace(new RegExp(" -- ", "g"), ", ")}
        </span>
      </div>
      <div className={`NetworkTooltip__info`}>
        {(data["Mission Type"] || [])
          .map((d) => d.toLowerCase().trim())
          .map((type) => (
            <span
              key={type}
              className="NetworkTooltip__type-name"
              style={{ color: typeColors[type] }}
            >
              {type}
            </span>
          ))}
      </div>
       */}
      <svg className="NetworkTooltip__arrow" viewBox="0 0 3 2">
        <path d="M 1 0 L 3 0 L 0 2 Z" fill="white"></path>
      </svg>
    </div>
  );
};
export default NetworkTooltip;
