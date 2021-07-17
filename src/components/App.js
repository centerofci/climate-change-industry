import React, { useMemo } from "react";

import { data } from "./../constants";
import { useQueryParams } from "./../utils";
import Network from "./Network/Network";
import MapWrapper from "./Map/MapWrapper";
import Benchmarks from "./Benchmarks/Benchmarks";

import "./App.css";

console.log(data);

function App() {
  const [params, updateParams] = useQueryParams();

  const onChangeState = (type, newState) => {
    updateParams({ [type]: newState });
  };

  const viz = params["viz"] || "network";
  const groupType = params["group"] || "Interventions";
  const searchTerm = params["search"] || "";
  const isEmbed = !!params["embed"];
  const projectionName = params["projection"];

  const focusedItem = useMemo(() => {
    if (!params["item"]) return null;
    const itemGroupType = params["item"].split("--")[0];
    const matchingItem = (data[itemGroupType || groupType] || []).find(
      (d) => d["id"] === params["item"]
    );
    if (!matchingItem) return null;
    return matchingItem;
  }, [params["item"], data]);

  const focusedNode = useMemo(() => {
    if (!params["focused"] || typeof params["focused"] != "string") return null;
    const itemGroupType = params["focused"].split("--")[0];
    const matchingItem = (data[itemGroupType || groupType] || []).find(
      (d) => d["id"] === params["focused"]
    );
    if (!matchingItem) return null;
    return matchingItem;
  }, [params["focused"], data]);

  return (
    <div className={`App App--is-${isEmbed ? "embed" : "normal"}`}>
      <div className="App__nav">
        <a
          href="?viz=network"
          className={viz === "network" ? "active" : "inactive"}
        >
          Network
        </a>
        <a href="?viz=map" className={viz === "map" ? "active" : "inactive"}>
          Map
        </a>
        <a href="?viz=benchmarks" className={viz === "benchmarks" ? "active" : "inactive"}>
          Benchmarks
        </a>
      </div>
      {viz === "network" ? (
        <Network
          {...{
            data,
            groupType,
            focusedItem,
            focusedNode,
            searchTerm,
            onChangeState,
          }}
        />
      ) : viz === "benchmarks" ? (
        <Benchmarks
          data={data}
        />

      ) : (
        <MapWrapper
          data={data}
          {...{
            focusedItem,
            projectionName,
            onChangeState,
          }}
        />
      )}
    </div>
  );
}

export default App;
