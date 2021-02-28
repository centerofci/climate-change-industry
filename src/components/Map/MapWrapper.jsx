import React, { useMemo } from "react";
import { group } from "d3";

import Map from "./Map";

const MapWrapper = ({ data }) => {
  console.log(data);

  const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

  const groupedData = useMemo(
    () => Array.from(group(data["Actors"], countryAccessor)),
    [data]
  );
  console.log("groupedData", groupedData);

  return (
    <div className="MapWrapper">
      <Map data={groupedData} allData={data} />
    </div>
  );
};

export default MapWrapper;
