import React from "react";
import { format } from "d3";

import { move, truncate } from "./../../utils";
import { typeColors } from "./../../constants";

import "./NetworkTooltip.css";

const NetworkTooltip = ({ data, groupType, isFocused, onFocus }) => {
  return (
    <div className={["NetworkTooltip"].join(" ")}>
      <div className="NetworkTooltip__name">
        {!!data["year"] && (
          <div className="NetworkTooltip__year">{data["year"]}</div>
        )}
        {data["label"]}
      </div>
      {/* <div className="NetworkTooltip__text">{data["type"].slice(0, -1)}</div> */}
      {data["Amount"] && (
        <div className="NetworkTooltip__text">
          ${format(",.0f")(data["Amount"])}
        </div>
      )}
      {data["mainContributionArea"] && (
        <div className="NetworkTooltip__text">
          {data["mainContributionArea"].join(" & ")}
        </div>
      )}
      {data["Entity Type"] && (
        <div className="NetworkTooltip__text">
          {data["Entity Type"].join(", ")}
        </div>
      )}
      {/* {data["Focus"] && (
        <div className="NetworkTooltip__text">{data["Focus"]}</div>
      )} */}
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
      {/* <svg className="NetworkTooltip__arrow" viewBox="0 0 3 2">
        <path d="M 1 0 L 3 0 L 0 2 Z" fill="white"></path>
      </svg> */}

      {groupType == "Actors" ? (
        isFocused ? (
          <button
            className="NetworkTooltip__more"
            onClick={() => onFocus(data["id"])}
          >
            More info
          </button>
        ) : (
          <div className="NetworkTooltip__note">Click to center</div>
        )
      ) : (
        <div className="NetworkTooltip__note">Click for more info</div>
      )}
    </div>
  );
};
export default NetworkTooltip;
