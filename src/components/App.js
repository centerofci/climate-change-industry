import React, { useEffect, useMemo, useState } from "react";

import { data } from "./../constants";
import { useQueryParams } from "./../utils";
import Network from "./Network/Network";

import "./App.css";
console.log(data);

function App() {
  const [params, updateParams] = useQueryParams();

  const onChangeState = (type, newState) => {
    console.log("change", type);
    updateParams({ [type]: newState });
  };

  const viz = params["viz"] || "network";
  const groupType = params["group"] || "Interventions";
  const searchTerm = params["search"] || "";

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
    <div className={`App`}>
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
      ) : // <Objectives
      //   data={data["Objectives"]}
      //   investigations={data["Investigations"]}
      //   instruments={data["Instruments/Payloads"]}
      //   missions={data["Missions"]}
      //   focusedObjective={focusedObjective}
      //   onChangeState={onChangeState}
      // />
      null}
      {/* <SvgPatterns /> */}
    </div>
  );
}

export default App;

// const SvgPatterns = () => (
//   <svg width="0" height="0">
//     <defs>
//       <pattern
//         id="stripes"
//         patternUnits="userSpaceOnUse"
//         width="7"
//         height="7"
//         patternTransform="rotate(45)"
//       >
//         <line y2="7" stroke="#fff" strokeWidth="5"></line>
//       </pattern>
//       <pattern
//         id="x"
//         patternContentUnits="objectBoundingBox"
//         width="100%"
//         height="100%"
//       >
//         <line
//           style={{ strokeLinecap: "round" }}
//           x1="0.33"
//           x2="0.67"
//           y1="0.33"
//           y2="0.67"
//           stroke="#fff"
//           strokeWidth="0.13"
//         ></line>
//         <line
//           style={{ strokeLinecap: "round" }}
//           x1="0.67"
//           x2="0.33"
//           y1="0.33"
//           y2="0.67"
//           stroke="#fff"
//           strokeWidth="0.13"
//         ></line>
//       </pattern>
//     </defs>
//   </svg>
// );
