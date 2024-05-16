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
  const focusedMitigationArea = params["mitigation-area"];
  const focusedCountry = params["country"];
  const backCountry = params["back-country"];
  const backMitigationArea = params["back-mitigation-area"];

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

  const onChangeViz = (viz, e) => {
    e.preventDefault()
    // change the url param
    onChangeState("viz", viz);
  }

  return (
    <div className={`App App--is-${isEmbed ? "embed" : "normal"}`}>
      <div className="App__nav">
        {[
          ["Network", "network"],
          ["Map", "map"],
          ["Earth Health KPIs", "benchmarks"],
        ].map(([label, slug]) => (
          <a
            key={slug}
            href={`?viz=${slug}`}
            className={viz === slug ? "active" : "inactive"}
            onClick={(e) => onChangeViz(slug, e)}
          >
            {label}
          </a>
        ))}
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
            focusedCountry,
            focusedMitigationArea,
            backCountry,
            backMitigationArea,
            projectionName,
            onChangeState,
          }}
        />
      )}
    </div>
  );
}

export default App;
