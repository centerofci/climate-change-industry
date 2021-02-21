import React, { useMemo, useState } from "react";

import Icon from "./../Icon/Icon";

import { fieldLabels } from "./../../constants";
import { flatten, toTitleCase } from "./../../utils";

import "./NetworkList.css";

const NetworkList = ({ data, filters, focusedNode, setFocusedNodeId }) => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const isItemActive = (item) => {
    if (!activeFilters.length) return true;

    const unsatisifiedActiveFilters = activeFilters.filter(
      ({ type, value: filterValue }) => {
        const value = getFilterFromItem(item, type);
        if (!value.length) return true;
        if (value.includes(filterValue)) return false;
        return true;
      }
    );
    return !unsatisifiedActiveFilters.length;
  };

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

  const onSetFilter = (type, value) => {
    const otherActiveFilters = activeFilters.filter(
      (filter) => filter.type != type
    );
    if (!value) {
      setActiveFilters(otherActiveFilters);
    } else {
      setActiveFilters([...otherActiveFilters, { type, value }]);
    }
  };

  const getFilterValue = (type) => {
    const activeFilterOfType = activeFilters.find(
      (filter) => filter["type"] == type
    );
    return activeFilterOfType ? activeFilterOfType["value"] : null;
  };

  const [actors, organizations] = useMemo(
    () => [
      data
        .filter((d) => d["Person or Org"] != "Organization" && isItemActive(d))
        .sort((a, b) => (b.label > a.label ? -1 : 1)),
      data
        .filter((d) => d["Person or Org"] == "Organization" && isItemActive(d))
        .sort((a, b) => (b.label > a.label ? -1 : 1)),
    ],
    [data, activeFilters]
  );

  return (
    <div className="NetworkList">
      {parsedFilters.map(({ name, values }) => (
        <div className="NetworkList__filter" key={name}>
          <select
            className="NetworkList__select"
            value={getFilterValue(name) || ""}
            onChange={(e) => {
              onSetFilter(name, e.target.value);
            }}
          >
            <option value="">
              - Filter list by {fieldLabels[name] || name} -
            </option>
            {values.map((value) => {
              return (
                <option key={value} value={value}>
                  {toTitleCase(value)}
                </option>
              );
            })}
          </select>
          {getFilterValue(name) && (
            <button
              className="NetworkList__clear"
              onClick={() => onSetFilter(name, null)}
            >
              <Icon name="x" size="s" />
            </button>
          )}
        </div>
      ))}

      <div className="NetworkList__filter">
        <h6>Individuals</h6>
        {actors.map((d) => {
          const isSelected = d.id == (focusedNode || {}).id;
          return (
            <div
              className={`NetworkList__filter__item NetworkList__filter__item--is-${
                isSelected ? "selected" : "unselected"
              }`}
              key={d.id}
              onClick={() => setFocusedNodeId(d["id"])}
              // onMouseLeave={() => onMouseLeaveItem(name, null)}
            >
              {d.label}
            </div>
          );
        })}

        <br />
        <h6>Organizations</h6>
        {organizations.map((d) => {
          const isSelected = d.id == (focusedNode || {}).id;
          return (
            <div
              className={`NetworkList__filter__item NetworkList__filter__item--is-${
                isSelected ? "selected" : "unselected"
              }`}
              key={d.id}
              onClick={() => setFocusedNodeId(d["id"])}
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
