import React, { useCallback, useMemo, useState } from "react";
import Select from "react-select";
import { active, group } from "d3";

import Globe from "./Globe";
import GlobeCountry from "./GlobeCountry";
import NetworkModal from "./../Network/NetworkModal";
import CountryModal from "./../Network/CountryModal";
import Map, { projectionNameOptionsParsed } from "./Map";

import "./MapWrapper.css";
import NetworkFilters from "../Network/NetworkFilters";

const MapWrapper = ({
  data = {},
  projectionName,
  focusedCountry,
  focusedMitigationArea,
  focusedItem,
  backCountry,
  backMitigationArea,
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

  const setFocusedCountry = useCallback((newCountry) => {
    onChangeState("country", newCountry && newCountry.countryName);
    onChangeState("mitigation-area", newCountry && newCountry.mitigationArea);
  });
  const setFocusedItem = useCallback((newItem) => {
    onChangeState("item", newItem && newItem.id);
  });

  const onCloseFocusedItem = useCallback(() => {
    setFocusedItem(null);
    setFocusedCountry(null);
    onChangeState("back-country", null);
    onChangeState("back-mitigation-area", null);
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
        ) : projection.value === "globe-country" ? (
          <GlobeCountry
            data={groupedData}
            allData={parsedData}
            {...{ focusedItem, setFocusedItem: setFocusedCountry }}
          />
        ) : projection.value === "globe-day" ? (
          <Globe
            data={groupedData}
            allData={parsedData}
            imageName="day"
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
        <NetworkModal info={focusedItem} backCountry={backCountry} backMitigationArea={backMitigationArea} onChangeState={onChangeState} onClose={onCloseFocusedItem} />
      )}
      {focusedCountry && (
        <CountryModal country={focusedCountry} mitigationArea={focusedMitigationArea} actors={data["Actors"].filter(actor => (
          countryAccessor(actor) === focusedCountry
          && (!focusedMitigationArea || (actor["mainContributionArea"] || []).includes(focusedMitigationArea))
        ))} onChangeState={onChangeState} onClose={onCloseFocusedItem} />
      )}
    </div>
  );
};

export default MapWrapper;

const typeOptions = [
  {
    label: "Globe (rollup)",
    value: "globe-country",
  },
  {
    label: "Globe",
    value: "globe",
  },
  {
    label: "Globe (light theme)",
    value: "globe-day",
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
