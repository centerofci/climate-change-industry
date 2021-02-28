import React, { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10, scaleSqrt } from "d3";

import {
  getRandomBetween,
  scaleCanvas,
  useChartDimensions,
} from "./../../utils";
import countryShapes from "./countries.json";

import "./Map.css";

const sphere = { type: "Sphere" };
const countryAccessor = (d) => d["Primary Operating Geography (Country)"];

const MapWrapper = ({ allData, data }) => {
  const [ref, dms] = useChartDimensions();
  const [blankMap, setBlankMap] = useState();
  const canvasElement = useRef();

  const { height, projection, pathGenerator } = useMemo(() => {
    const maxHeight = window.innerHeight;
    try {
      const projection = geoNaturalEarth1().fitSize(
        [dms.width, maxHeight],
        sphere
      );

      const pathGenerator = geoPath(projection);
      const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);
      const height = y1;

      return {
        height,
        projection,
        pathGenerator,
      };
    } catch (e) {
      console.log(e);
      return {};
    }
  }, [dms.width]);

  const draw = () => {
    if (!canvasElement.current) return;
    console.log(data);
    const ctx = canvasElement.current.getContext("2d");
    scaleCanvas(canvasElement.current, ctx, dms.width, height);
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

      // console.log(countryShapes);
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

    if (dms.width > 0) {
      setBlankMap(ctx.getImageData(0, 0, dms.width * 2, height * 2));
    }
  };
  useEffect(draw, [projection, dms.width]);

  const getCentroid = (country) => {
    const centroid = geoPath(projection).centroid(country);
    return centroid;
  };

  const rScale = useMemo(
    () =>
      scaleSqrt()
        .domain([0, Math.max(...data.map((d) => d[1].length))])
        .range([0.1, dms.width * 0.06]),
    [dms.width, data]
  );

  const bubbles = useMemo(
    () => data.map((d) => [d[0], d[1], rScale(d[1].length)]),
    [rScale]
  );

  const countryNamesMap = { USA: "United States of America" };
  const drawBubbles = () => {
    if (!canvasElement.current) return;
    if (!blankMap) return;

    const ctx = canvasElement.current.getContext("2d");

    ctx.putImageData(blankMap, 0, 0);

    ctx.globalCompositeOperation = "multiply";
    bubbles.forEach(([name, entities, r], i) => {
      const lookupName = countryNamesMap[name] || name;
      const country = Object.values(countryShapes).find(
        (d) => d.properties.geounit == lookupName
      );
      if (!country) return;
      const centroid = getCentroid(country);
      if (!centroid) return;

      ctx.beginPath();
      // const opacity = 1;
      ctx.fillStyle = "#5da17c";
      ctx.arc(...centroid, r, 0, 2 * Math.PI);
      ctx.fill();
    });

    const arcs = allData["Investments"]
      .map((investment) => {
        const getActorCountry = (actorName) => {
          const actorObject = allData["Actors"].find(
            (d) => d["label"] == actorName
          );
          console.log({ actorName, actorObject });
          if (!actorObject) return;
          const name = countryAccessor(actorObject);
          if (!name) return;
          const lookupName = countryNamesMap[name] || name;
          const country = Object.values(countryShapes).find(
            (d) => d["properties"]["geounit"] == lookupName
          );
          console.log({ name, country });
          if (!country) return;
          const centroid = getCentroid(country).map(
            (d) => d + getRandomBetween(-dms.width * 0.005, dms.width * 0.005)
          );
          return { name, centroid };
        };
        const from = (investment["Source"] || [])
          .map((d) => getActorCountry(d))
          .find((d) => d);
        const to = (investment["Recipient"] || [])
          .map((d) => getActorCountry(d))
          .find((d) => d);
        console.log(investment, { from, to });
        if (!from || !to) return;
        return { from, to };
      })
      .filter((d) => d);
    console.log(arcs);

    const pathGenerator = geoPath(projection, ctx);

    arcs.forEach(({ from, to }) => {
      ctx.beginPath();
      console.log(projection.invert(from.centroid));
      pathGenerator({
        type: "LineString",
        coordinates: [
          projection.invert(from.centroid),
          projection.invert(to.centroid),
        ],
      });
      ctx.strokeStyle = "#0d0c12";
      ctx.stroke();
    });

    ctx.globalCompositeOperation = "normal";
  };

  useEffect(drawBubbles, [blankMap, rScale, dms.width, projection]);

  return (
    <div className="Map" ref={ref}>
      <canvas
        ref={canvasElement}
        style={{ width: `${dms.width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default MapWrapper;
