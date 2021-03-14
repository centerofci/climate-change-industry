import React, { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10, scaleSqrt } from "d3";

import {
  getSpiralPositions,
  scaleCanvas,
  useChartDimensions,
} from "./../../utils";
import countryShapes from "./countries.json";

import "./Map.css";

const sphere = { type: "Sphere" };
const countryAccessor = (d) => d["Primary Operating Geography (Country)"];
const spiralPositions = getSpiralPositions(100, 5, 2.5, 1.5);

const MapWrapper = ({ allData, data }) => {
  const [ref, dms] = useChartDimensions();
  const [blankMap, setBlankMap] = useState();
  const canvasElement = useRef();

  const width = useMemo(() => Math.min(1400, dms.height * 1.3, dms.width), [
    dms.width,
    dms.height,
  ]);

  const { height, projection } = useMemo(() => {
    const maxHeight = window.innerHeight;
    try {
      const projection = geoNaturalEarth1().fitSize([width, maxHeight], sphere);

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
  }, [width]);

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
      // if (!isVertical) ctx.clip();

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
      // ctx.restore(); // stop clipping

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

  const bubbles = useMemo(() => data.map((d) => [d[0], d[1], d[1].length]), [
    data,
  ]);

  const countryNamesMap = { USA: "United States of America" };
  const drawBubbles = () => {
    if (!canvasElement.current) return;
    if (!blankMap) return;

    const ctx = canvasElement.current.getContext("2d");

    ctx.putImageData(blankMap, 0, 0);

    ctx.globalCompositeOperation = "multiply";
    bubbles.forEach(([name, entities, numberOfCircles], i) => {
      const lookupName = countryNamesMap[name] || name;
      const country = Object.values(countryShapes).find(
        (d) => d.properties.geounit == lookupName
      );
      if (!country) return;
      const centroid = getCentroid(country);
      if (!centroid) return;

      ctx.fillStyle = "#5da17c";
      const r = 5;
      for (let i = 0; i < numberOfCircles; i++) {
        ctx.beginPath();
        const spiralPosition = spiralPositions[i];
        // const opacity = 1;

        ctx.arc(
          centroid[0] + spiralPosition.x,
          centroid[1] + spiralPosition.y,
          r,
          0,
          2 * Math.PI
        );
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

  useEffect(drawBubbles, [blankMap, data, width, projection]);

  return (
    <div className="Map" ref={ref}>
      <canvas
        ref={canvasElement}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default MapWrapper;
