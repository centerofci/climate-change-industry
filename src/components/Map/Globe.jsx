import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";

// import verticalProjection from "./vertical-projection";

import countryShapes from "./countries.json";
import countryCentersMap from "./country-centers.json";
import { getSpiralPositions } from "./../../utils";
// import GlobeTooltip from "./GlobeTooltip";
import Globe from "react-globe.gl";
import MapTooltip from "./MapTooltip";

import "./Globe.css";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";

const countryAccessor = (d) => d["Primary Operating Geography (Country)"];
const spiralPositions = getSpiralPositions(100, 5, 2.5, 1.5);
const countryNamesMap = { USA: "United States of America" };

const getCentroid = (country) => countryCentersMap[country];

const GlobeWrapper = ({ allData, data }) => {
  const [hoveredItem, setHoveredItem] = useState();
  // const globeElement = useRef();

  // const canvasElement = useRef();

  // const width = useMemo(() => Math.min(1400, dms.height * 1.3, dms.width), [
  //   dms.width,
  //   dms.height,
  // ]);

  // const getCentroid = (country) => {
  //   const centroid = geoPath(projection).centroid(country);
  //   return centroid;
  // };

  // const rScale = useMemo(
  //   () =>
  //     scaleSqrt()
  //       .domain([0, Math.max(...data.map((d) => d[1].length))])
  //       .range([0.1, width * 0.06]),
  //   [width, data]
  // );
  const { bubbles, arcs } = useMemo(() => {
    // const heightScale = scaleLinear()
    //   .domain(extent(data.map((d) => d[1].length)))
    //   .range([0.1, 0.6]);

    let bubbles = [];
    data.forEach(([countryName, actors]) => {
      const lookupName = countryNamesMap[countryName] || countryName;
      const country = Object.values(countryShapes).find(
        (d) => d.properties.geounit == lookupName
      );
      if (!country) return;
      const centroid = getCentroid(country.properties.geounit);
      if (!centroid) return;

      // bubbles.push({
      //   lat: centroid[1],
      //   lng: centroid[0],
      //   alt: heightScale(actors.length),
      // });
      actors.forEach((d, i) => {
        const spiralPosition = spiralPositions[i];

        bubbles.push({
          ...d,
          name: d["label"],
          lat: centroid[1] + spiralPosition.x * 0.2,
          lng: centroid[0] + spiralPosition.y * 0.3,
          // alt: heightScale(actors.length),
          alt: 0.05,
          // ...d,
          // country,
          // x: centroid[0] + spiralPosition.x,
          // y: centroid[1] + spiralPosition.y,
        });
      });
    });

    const arcs = allData["Investments"]
      .map((investment) => {
        const getActorObject = (actorName) => {
          const actorObject = allData["Actors"].find(
            (d) => d["label"] == actorName
          );
          return actorObject;
        };
        const getActorCountry = (actorObject) => {
          const name = countryAccessor(actorObject);
          if (!name) return;
          const lookupName = countryNamesMap[name] || name;
          const country = Object.values(countryShapes).find(
            (d) => d["properties"]["geounit"] == lookupName
          );
          if (!country) return;
          const centroid = getCentroid(country.properties.geounit);
          return { name, centroid };
        };
        const fromObject = (investment["Source"] || [])
          .map(getActorObject)
          .find((d) => d);
        const toObject = (investment["Recipient"] || [])
          .map(getActorObject)
          .find((d) => d);
        if (!fromObject || !toObject) return;

        const from = getActorCountry(fromObject);
        const to = getActorCountry(toObject);

        const getCountryOffset = (source) => {
          const filteredCountries = data.find(
            ([country]) => country == countryAccessor(source)
          );
          if (!filteredCountries) return [0, 0];

          const index = filteredCountries[1].findIndex(
            (d) => d.id == source.id
          );
          const spiralPosition = spiralPositions[index];
          return [spiralPosition.x * 0.3, spiralPosition.y * 0.2];
        };
        if (!from || !to) return;
        const fromOffset = getCountryOffset(fromObject);
        const toOffset = getCountryOffset(toObject);

        return {
          from: { ...from, offset: fromOffset },
          to: { ...to, offset: toOffset },
          name: `${fromObject.label} - ${toObject.label}`,
          startLat: from.centroid[1] + fromOffset[1],
          startLng: from.centroid[0] + fromOffset[0],
          endLat: to.centroid[1] + toOffset[1],
          endLng: to.centroid[0] + toOffset[0],
        };
      })
      .filter((d) => d);

    return { bubbles, arcs };
  }, [data]);

  const onPointHover = (e) => {
    setHoveredItem(e);
    console.log(e);
  };

  const OPACITY = 0.8;
  return (
    <div className="Globe">
      {!!hoveredItem && <MapTooltip data={hoveredItem} />}

      <Globe
        // globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="#E2E8EE"
        pointsData={bubbles}
        pointAltitude={(d) => d["alt"]}
        pointRadius={0.5}
        // pointsMerge={true}
        onPointHover={onPointHover}
        arcsData={arcs}
        // arcColor={() => "#45aeb1"}
        arcColor={() => [
          `rgba(32, 190, 201, ${OPACITY})`,
          `rgba(0, 139, 148, ${OPACITY})`,
          // `rgba(255, 0, 0, ${OPACITY})`,
        ]}
        arcStroke={0.6}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        // pointOfView={{ lat: 38, lng: -97, altitude: 2.5 }}
        // ref={globeElement}
        // onMapReady={() => {
        //   console.log("HI", { globeElement });
        //   globeElement.current.pointOfView({
        //     lat: 39.6,
        //     lng: -98.5,
        //     altitude: 2,
        //   });
        // }}

        // pointsData={myData}
      />
      {/* <div className="Globe__controls" style={{ width: "20em" }}>
        <Select
          options={projectionNameOptionsParsed}
          value={projectionNameOptionsParsed.find(
            (d) => d.label === projectionName
          )}
          onChange={({ value }) => setProjectionName(value)}
        />
      </div> */}
      {/* <canvas
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoveredItem()}
        ref={canvasElement}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {!!hoveredItem && <GlobeTooltip data={hoveredItem} />} */}
    </div>
  );
};

export default GlobeWrapper;
