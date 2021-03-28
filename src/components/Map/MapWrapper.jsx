import React, { useCallback, useMemo, useState } from "react";
import Select from "react-select";
import { group } from "d3";

import Globe from "./Globe";
import NetworkModal from "./../Network/NetworkModal";
import Map, { projectionNameOptionsParsed } from "./Map";

import "./MapWrapper.css";

const MapWrapper = ({ data, focusedItem, onChangeState }) => {
  const [view, setView] = useState(typeOptions[0]);

  const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

  const groupedData = useMemo(
    () => Array.from(group(data["Actors"], countryAccessor)),
    [data]
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
        <Select options={typeOptions} value={view} onChange={setView} />
        {/* <Toggle options={toggleOptions} value={view} onChange={setView} /> */}
      </div>

      <div className="MapWrapper__main">
        {view.value === "globe" ? (
          <Globe
            data={groupedData}
            allData={data}
            {...{ focusedItem, setFocusedItem }}
          />
        ) : (
          <Map
            data={groupedData}
            allData={data}
            projectionName={view.value}
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

const toggleOptions = [
  { label: "Globe", id: "globe" },
  { label: "Map", id: "map" },
];

const typeOptions = [
  {
    label: "Globe",
    value: "globe",
  },
  ...projectionNameOptionsParsed,
];
