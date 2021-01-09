import React, { useEffect, useMemo, useState } from "react";
import { json } from "d3-fetch";

import { useQueryParams } from "./../utils";
import Network from "./Network/Network";

import "./App.css";

function App() {
  const [data, setData] = useState({});
  const [params, updateParams] = useQueryParams();
  const [status, setStatus] = useState("loading");

  const onChangeState = (type, newState) => {
    updateParams({ [type]: newState });
  };

  const viz = params["viz"] || "network";
  const groupType = params["group"] || "Interventions";
  const initialYear = params["year"] ? +params["year"] : null;
  const searchTerm = params["search"] || "";
  // const focusedMission = useMemo(() => {
  //   if (!params["mission"]) return null;
  //   const matchingMission = (data["Missions"] || []).find(
  //     (d) => d["name"] === params["mission"]
  //   );
  //   if (!matchingMission) return null;
  //   return matchingMission;
  // }, [params["mission"], data["Missions"]]);
  const focusedObjective = params["objective"];

  return (
    <div className={`App App--${status}`}>
      <DataFetcher {...{ setStatus, setData }} />
      {status === "loading" ? (
        <div className="App__loading">Loading...</div>
      ) : status === "success" ? (
        viz === "network" ? (
          <Network
            {...{
              data,
              initialYear,
              groupType,
              // focusedMission,
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
        null
      ) : status === "error" ? (
        <div className="App__error">There was an issue loading the data</div>
      ) : null}
      {/* <SvgPatterns /> */}
    </div>
  );
}

export default App;

const DataFetcher = ({ setStatus, setData }) => {
  useEffect(() => {
    (async function () {
      try {
        const res = await json(`/data.json`);
        const data = res;
        console.log(data);
        setData(data);
        setStatus("success");
      } catch (e) {
        console.log(e);
        setStatus("error");
      }
    })();
  }, []);

  return null;
};

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
