import React, { useMemo } from "react";

import Icon from "./../Icon/Icon";

import { fieldLabels } from "./../../constants";
import { flatten, toTitleCase } from "./../../utils";

import "./NetworkList.css";

const NetworkList = ({ data, focusedNode, setFocusedNode }) => {
  return (
    <div className="NetworkList">
      <div className="NetworkList__filter">
        <h6>Actors</h6>
        {data.map((d) => {
          const isSelected = d.id == (focusedNode || {}).id;
          return (
            <div
              className={`NetworkList__filter__item NetworkList__filter__item--is-${
                isSelected ? "selected" : "unselected"
              }`}
              key={d.id}
              onClick={() => setFocusedNode(d)}
              // onMouseLeave={() => onMouseLeaveItem(name, null)}
            >
              {d.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default NetworkList;

const getFilterFromItem = (d, filter) => {
  const value = d[filter];
  if (!value) return [];
  if (typeof value == "object") return value;
  return [value];
};
