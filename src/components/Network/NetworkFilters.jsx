import React, { useMemo } from "react";

import Icon from "./../Icon/Icon";

import { fieldLabels } from "./../../constants";
import { flatten, toTitleCase } from "./../../utils";

import "./NetworkFilters.css";

const NetworkFilters = ({ data, filters, activeFilters, onUpdateFilters }) => {
  const parsedFilters = useMemo(
    () =>
      filters.map((filter) => {
        const values = [
          ...new Set(flatten(data.map((d) => getFilterFromItem(d, filter)))),
        ];
        return { name: filter, values };
      }),
    [data, filters]
  );

  const onClickItem = (type, value) => {
    const activeFilterOfType = activeFilters.find(
      (filter) => filter["type"] == type
    );
    if (!activeFilterOfType) {
      onUpdateFilters([...activeFilters, { type, value }]);
      return;
    }
    const otherActiveFilters = activeFilters.filter(
      (filter) => filter.type != type
    );

    const isActiveFilter = activeFilterOfType["value"] == value;
    const newFilters = isActiveFilter
      ? otherActiveFilters
      : [...otherActiveFilters, { type, value }];

    onUpdateFilters(newFilters);
  };
  // const onMouseLeaveItem = (type, item) => {
  //   onUpdateFilters(type, item);
  // };

  const getFilterState = (type, value) => {
    const activeFilterOfType = activeFilters.find(
      (filter) => filter["type"] == type
    );
    if (!activeFilterOfType) return "normal";
    return activeFilterOfType["value"] == value ? "selected" : "unselected";
  };

  return (
    <div className="NetworkFilters">
      {parsedFilters.map(({ name, values }) => (
        <div className="NetworkFilters__filter">
          <h6>{fieldLabels[name] || name}</h6>
          {values.map((value) => {
            const state = getFilterState(name, value);
            return (
              <div
                className={`NetworkFilters__filter__item NetworkFilters__filter__item--is-${state}`}
                key={value}
                onClick={() => onClickItem(name, value)}
                // onMouseLeave={() => onMouseLeaveItem(name, null)}
              >
                {toTitleCase(value)}
                {state == "selected" && <Icon name="x" size="s" />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
export default NetworkFilters;

const getFilterFromItem = (d, filter) => {
  const value = d[filter];
  if (!value) return [];
  if (typeof value == "object") return value;
  return [value];
};
