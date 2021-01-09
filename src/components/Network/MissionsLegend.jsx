import React from "react";

import {typeColors } from "./../../constants";
import { toTitleCase } from "./../../utils";

import "./MissionsLegend.css";

const MissionsLegend = ({ onItemHover }) => {
  const types = Object.keys(typeColors);

  const onMouseEnterItem = (type, item) => {
    onItemHover(type, item);
  };

  return (
    <div className="MissionsLegend" onMouseLeave={() => onItemHover(null)}>
      <div className="MissionsLegend__statuses">
        <h6>Status</h6>
        {statuses.map((status) => (
          <div
            className="MissionsLegend__status"
            key={status}
            onMouseEnter={() => onMouseEnterItem("status", status)}
          >
            <svg className="MissionsLegend__dot" viewBox="-10 -10 20 20">
              <circle
                vectorEffect="non-scaling-stroke"
                r="10"
              ></circle>
            </svg>
            {status}
          </div>
        ))}
      </div>

      <div className="MissionsLegend__types">
        <h6>Type</h6>
        {types.map((type) => (
          <div
            className="MissionsLegend__type"
            style={{ color: typeColors[type] }}
            key={type}
            onMouseEnter={() => onMouseEnterItem("type", type)}
          >
            <svg className="MissionsLegend__dot" viewBox="-10 -10 20 20">
              <circle vectorEffect="non-scaling-stroke" r="10"></circle>
              <use href={`#${type}`}></use>
            </svg>
            {toTitleCase(type)}
          </div>
        ))}
      </div>
    </div>
  );
};
export default MissionsLegend;
