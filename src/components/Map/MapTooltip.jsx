import React from "react";
import { format } from "d3";

import { move, truncate } from "./../../utils";
import { typeColors } from "./../../constants";

import "./MapTooltip.css";

const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

const MapTooltip = ({ data }) => {
  return (
    <div className={["MapTooltip"].join(" ")}>
      <div className="MapTooltip__name">
        {!!data["year"] && (
          <div className="MapTooltip__year">{data["year"]}</div>
        )}
        {data["label"]}
      </div>
      {/* <div className="MapTooltip__text">{data["type"].slice(0, -1)}</div> */}
      {countryAccessor(data) && (
        <div className="MapTooltip__text">{countryAccessor(data)}</div>
      )}
      {data["Amount"] && (
        <div className="MapTooltip__text">
          ${format(",.0f")(data["Amount"])}
        </div>
      )}
      {data["mainContributionArea"] && (
        <div className="MapTooltip__text">
          {data["mainContributionArea"].join(" & ")}
        </div>
      )}
      {data["Entity Type"] && (
        <div className="MapTooltip__text">{data["Entity Type"].join(", ")}</div>
      )}
      {/* {data["Focus"] && (
        <div className="MapTooltip__text">{data["Focus"]}</div>
      )} */}
      {/* <div className="MapTooltip__info ">
        <span className={`MapTooltip__info actor actor--${data["actor"]}`}>
          {data["actors"].join(", ").replace(new RegExp(" -- ", "g"), ", ")}
        </span>
      </div>
      <div className={`MapTooltip__info`}>
        {(data["Mission Type"] || [])
          .map((d) => d.toLowerCase().trim())
          .map((type) => (
            <span
              key={type}
              className="MapTooltip__type-name"
              style={{ color: typeColors[type] }}
            >
              {type}
            </span>
          ))}
      </div>
       */}
      {/* <svg className="MapTooltip__arrow" viewBox="0 0 3 2">
        <path d="M 1 0 L 3 0 L 0 2 Z" fill="white"></path>
      </svg> */}

      {/* <div className="MapTooltip__note">Click for more info</div> */}
    </div>
  );
};
export default MapTooltip;
