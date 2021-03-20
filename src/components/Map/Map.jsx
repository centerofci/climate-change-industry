import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";

import {
  geoNaturalEarth1,
  geoMercator,
  geoPath,
  geoGraticule10,
  Delaunay,
  pointer,
  geoEqualEarth,
} from "d3";
import {
  geoArmadillo,
  geoBaker,
  geoBerghaus,
  geoEckert3,
  geoFahey,
  geoGilbert,
  geoGingery,
  geoGinzburg9,
  geoHealpix,
  geoHufnagel,
  geoInterruptedHomolosine,
  geoInterruptedMollweideHemispheres,
  geoPolyhedralWaterman,
} from "d3-geo-projection";
// import verticalProjection from "./vertical-projection";

import {
  getDistanceFromXY,
  getSpiralPositions,
  scaleCanvas,
  useChartDimensions,
} from "./../../utils";
import countryShapes from "./countries.json";
import MapTooltip from "./MapTooltip";

import "./Map.css";

const sphere = { type: "Sphere" };
const countryAccessor = (d) => d["Primary Operating Geography (Country)"];
const spiralPositions = getSpiralPositions(100, 5, 2.5, 1.5);
const countryNamesMap = { USA: "United States of America" };

const MapWrapper = ({ allData, data }) => {
  const [ref, dms] = useChartDimensions();
  const [blankMap, setBlankMap] = useState();
  const [hoveredItem, setHoveredItem] = useState();
  const [projectionName, setProjectionName] = useState(
    projectionNameOptions[0]
  );
  const canvasElement = useRef();

  const projectionFunction = projectionNameOptionsMap[projectionName];

  const width = useMemo(() => Math.min(1400, dms.height * 1.3, dms.width), [
    dms.width,
    dms.height,
  ]);

  const { height, projection } = useMemo(() => {
    const maxHeight = window.innerHeight - 100;
    try {
      const projection = projectionFunction().fitSize(
        [width, maxHeight],
        sphere
      );

      const pathGenerator = geoPath(projection);
      const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);
      const height = y1;

      return {
        height,
        projection,
      };
    } catch (e) {
      console.log(e);
      return {};
    }
  }, [width, projectionFunction]);

  const draw = () => {
    if (!canvasElement.current) return;
    const ctx = canvasElement.current.getContext("2d");
    scaleCanvas(canvasElement.current, ctx, width, height);
    const pathGenerator = geoPath(projection, ctx);

    const drawMap = () => {
      const drawPath = (shape) => {
        ctx.beginPath();
        pathGenerator(shape);
      };
      drawPath(sphere);
      ctx.save();
      ctx.clip();

      const fill = (color) => {
        ctx.fillStyle = color;
        ctx.fill();
      };
      const stroke = (color) => {
        ctx.strokeStyle = color;
        ctx.stroke();
      };
      drawPath(sphere);
      fill("#fff");
      stroke("#bbb");
      drawPath(geoGraticule10());
      stroke("#eee");

      Object.values(countryShapes).forEach((shape) => {
        // countryShapes.forEach((shape) => {
        drawPath(shape);
        fill("#f8f8f8");
        stroke("#ccc");
      });
      ctx.restore(); // stop clipping

      drawPath(sphere);
      stroke("#ccc");
      // ctx.fillRect(10, 10, 100, 100);
    };
    drawMap();

    // bubbleSizes.set(new Array(20).fill(0).map((d) => [0, 0]));

    if (width > 0) {
      setBlankMap(ctx.getImageData(0, 0, width * 2, height * 2));
    }
  };
  useEffect(draw, [projection, width]);

  const getCentroid = (country) => {
    const centroid = geoPath(projection).centroid(country);
    return centroid;
  };

  // const rScale = useMemo(
  //   () =>
  //     scaleSqrt()
  //       .domain([0, Math.max(...data.map((d) => d[1].length))])
  //       .range([0.1, width * 0.06]),
  //   [width, data]
  // );

  const bubbles = useMemo(() => {
    let bubbles = [];
    data.forEach(([countryName, actors]) => {
      const lookupName = countryNamesMap[countryName] || countryName;
      const country = Object.values(countryShapes).find(
        (d) => d.properties.geounit == lookupName
      );
      if (!country) return;
      const centroid = getCentroid(country);
      if (!centroid) return;

      actors.forEach((d, i) => {
        const spiralPosition = spiralPositions[i];

        bubbles.push({
          ...d,
          country,
          x: centroid[0] + spiralPosition.x,
          y: centroid[1] + spiralPosition.y,
        });
      });
    });
    return bubbles;
  }, [data, projection]);

  const voronoi = useMemo(() => Delaunay.from(bubbles.map((d) => [d.x, d.y])), [
    bubbles,
  ]);

  const drawBubbles = () => {
    if (!canvasElement.current) return;
    if (!blankMap) return;

    const ctx = canvasElement.current.getContext("2d");

    ctx.putImageData(blankMap, 0, 0);
    ctx.restore(); // stop clipping

    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#5da17c";
    const r = 5;

    bubbles.forEach(({ id, x, y }) => {
      ctx.beginPath();
      if (hoveredItem && hoveredItem.id == id) {
        ctx.fillStyle = "#45a";
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#5da17c";
      } else {
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
      }
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
          const centroid = getCentroid(country);
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
          return [spiralPosition.x, spiralPosition.y];
        };
        if (!from || !to) return;
        const fromOffset = getCountryOffset(fromObject);
        const toOffset = getCountryOffset(toObject);
        return {
          from: { ...from, offset: fromOffset },
          to: { ...to, offset: toOffset },
        };
      })
      .filter((d) => d);

    const pathGenerator = geoPath(projection, ctx);

    arcs.forEach(({ from, to }) => {
      ctx.beginPath();
      pathGenerator({
        type: "LineString",
        coordinates: [
          projection.invert([
            from.centroid[0] + from.offset[0],
            from.centroid[1] + from.offset[1],
          ]),
          projection.invert([
            to.centroid[0] + to.offset[0],
            to.centroid[1] + to.offset[1],
          ]),
        ],
      });
      ctx.strokeStyle = "#0d0c12";
      ctx.stroke();
    });

    ctx.globalCompositeOperation = "normal";
  };

  useEffect(drawBubbles, [blankMap, data, width, projection, hoveredItem]);

  const onMouseMove = (e) => {
    const [x, y] = pointer(e);
    const pointIndex = voronoi.find(x, y);
    const point = bubbles[pointIndex];
    const distance = getDistanceFromXY([point.x - x, point.y - y]);
    if (distance > 100) {
      setHoveredItem();
    } else {
      setHoveredItem(point);
    }
  };

  return (
    <div className="Map" ref={ref}>
      <div className="Map__controls" style={{ width: "20em" }}>
        <Select
          options={projectionNameOptionsParsed}
          value={projectionNameOptionsParsed.find(
            (d) => d.label === projectionName
          )}
          onChange={({ value }) => setProjectionName(value)}
        />
      </div>
      <canvas
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoveredItem()}
        ref={canvasElement}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {!!hoveredItem && <MapTooltip data={hoveredItem} />}
    </div>
  );
};

export default MapWrapper;

const projectionNameOptionsMap = {
  // vertical: verticalProjection,
  "natural earth": geoNaturalEarth1,
  mercator: geoMercator,
  "equal earth": geoEqualEarth,
  armadillo: geoArmadillo,
  baker: geoBaker,
  berghaus: geoBerghaus,
  eckert: geoEckert3,
  fahey: geoFahey,
  gilbert: geoGilbert,
  gingery: geoGingery,
  healpix: geoHealpix,
  ginzberg: geoGinzburg9,
  hufnagel: geoHufnagel,
  "interrupted homolosine": geoInterruptedHomolosine,
  "mollweide split": geoInterruptedMollweideHemispheres,
  "polyhedral waterman": geoPolyhedralWaterman,
};
const projectionNameOptions = Object.keys(projectionNameOptionsMap);
const projectionNameOptionsParsed = projectionNameOptions.map(
  (projectionNameOption) => ({
    label: projectionNameOption,
    value: projectionNameOption,
  })
);
