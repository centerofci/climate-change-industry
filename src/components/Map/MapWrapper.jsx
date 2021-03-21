import React, { useMemo, useState } from "react";
import { group } from "d3";

import Globe from "./Globe";
import Map from "./Map";
import Toggle from "./../Toggle/Toggle";

const MapWrapper = ({ data }) => {
  const [view, setView] = useState("globe");
  console.log(data);

  const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

  const groupedData = useMemo(
    () => Array.from(group(data["Actors"], countryAccessor)),
    [data]
  );

  return (
    <div className="MapWrapper">
      <div className="MapWrapper__controls">
        <Toggle options={toggleOptions} value={view} onChange={setView} />
      </div>

      {view === "globe" ? (
        <Globe data={groupedData} allData={data} />
      ) : (
        <Map data={groupedData} allData={data} />
      )}
    </div>
  );
};

export default MapWrapper;

const toggleOptions = [
  { label: "Globe", id: "globe" },
  { label: "Map", id: "map" },
];
