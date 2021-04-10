import React, { useCallback, useMemo, useState } from "react";
import Select from "react-select";
import { active, group } from "d3";

import Globe from "./Globe";
import NetworkModal from "./../Network/NetworkModal";
import Map, { projectionNameOptionsParsed } from "./Map";

import "./MapWrapper.css";
import NetworkFilters from "../Network/NetworkFilters";

const MapWrapper = ({
  data = {},
  projectionName,
  focusedItem,
  onChangeState,
}) => {
  const [activeFilters, setActiveFilters] = useState([]);

  const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

  const setMapProjection = (newProjection) => {
    onChangeState("projection", newProjection.label);
  };
  const projection =
    typeOptions.find((d) => d.label === projectionName) || typeOptions[0];

  const parsedData = useMemo(() => {
    return {
      ...data,
      Actors: (data["Actors"] || [])
        .map((item) => {
          const unsatisifiedActiveFilters = activeFilters.filter(
            ({ type, value: filterValue }) => {
              const value = getFilterFromItem(item, type) || [];
              if (!value.length) return true;
              // if (source) {
              //   const sourceValue = getFilterFromItem(source, type);
              //   if (!sourceValue.includes(filterValue)) return true;
              //   return false;
              // }
              if (value.includes(filterValue)) return false;
              return true;
            }
          );
          const opacity = unsatisifiedActiveFilters.length ? 0.13 : 1;
          return { ...item, opacity };
        })
        .sort((a, b) => {
          const aValue = a["Person or Org"] === "Individual Person" ? 1 : 0;
          const bValue = b["Person or Org"] === "Individual Person" ? 1 : 0;
          return aValue - bValue;
        }),
    };
  }, [data, activeFilters]);

  const groupedData = useMemo(
    () => Array.from(group(parsedData["Actors"], countryAccessor)),
    [parsedData]
  );

  const setFocusedItem = useCallback((newItem) => {
    onChangeState("item", newItem && newItem.id);
  });

  const onCloseFocusedItem = useCallback(() => {
    setFocusedItem(null);
  }, []);

  return (
    <div className="MapWrapper">
      <div className="MapWrapper__controls">
        <Select
          options={typeOptions}
          value={projection}
          onChange={setMapProjection}
        />
        {/* <Toggle options={toggleOptions} value={projection} onChange={setView} /> */}

        <h6 className="MapWrapper__sidebar__bottom-label">Filter by</h6>

        <div className="MapWrapper__sidebar">
          <NetworkFilters
            filters={filterFields}
            {...{ activeFilters }}
            data={data["Actors"]}
            onUpdateFilters={setActiveFilters}
          />
        </div>
      </div>

      <div className="MapWrapper__main">
        {projection.value === "globe" ? (
          <Globe
            data={groupedData}
            allData={parsedData}
            {...{ focusedItem, setFocusedItem }}
          />
        ) : (
          <Map
            data={groupedData}
            allData={parsedData}
            projectionName={projection.value}
            {...{ focusedItem, setFocusedItem }}
          />
        )}
      </div>

      {focusedItem && (
        <NetworkModal info={focusedItem} onClose={onCloseFocusedItem} />
      )}
    </div>
  );
};

export default MapWrapper;

const typeOptions = [
  {
    label: "Globe",
    value: "globe",
  },
  ...projectionNameOptionsParsed,
];

const filterFields = [
  "mainContributionArea",
  "Entity Type",
  "Topical Contribution Area",
  "Person or Org",
];

const getFilterFromItem = (d, filter) => {
  const value = d[filter];
  if (!value) return [];
  if (typeof value == "object") return value;
  return [value];
};
