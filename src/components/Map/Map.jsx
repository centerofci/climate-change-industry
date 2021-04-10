import React, { useEffect, useMemo, useRef, useState } from "react";

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
const spiralPositions = getSpiralPositions(100, 5, 2, 1.2);
const countryNamesMap = { USA: "United States of America" };

const MapWrapper = ({ allData, data, projectionName, setFocusedItem }) => {
  const [ref, dms] = useChartDimensions();
  const [blankMap, setBlankMap] = useState();
  const [hoveredItem, setHoveredItem] = useState();
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
        const color =
          d["Person or Org"] === "Individual Person"
            ? `rgba(91, 156, 121, 1)`
            : `rgba(49, 63, 83, 1)`;
        bubbles.push({
          ...d,
          country,
          color,
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
    const r = 3;

    bubbles.forEach(({ id, color, opacity, x, y }) => {
      ctx.beginPath();
      if (hoveredItem && hoveredItem.id == id) {
        ctx.fillStyle = "#45a";
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#5da17c";
      } else {
        // const color = `rgba(91, 156, 121, ${opacity})`;
        ctx.fillStyle = multiplyRgbaOpacity(color, opacity);
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    const arcOpacity = 0.8;
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
    const getCountryOffset = (source) => {
      const filteredCountries = data.find(
        ([country]) => country == countryAccessor(source)
      );
      if (!filteredCountries) return [0, 0];

      const index = filteredCountries[1].findIndex((d) => d.id == source.id);
      const spiralPosition = spiralPositions[index];

      return [spiralPosition.x, spiralPosition.y];
    };

    const investments = allData["Investments"]
      .map((investment) => {
        const fromObject = (investment["Source"] || [])
          .map(getActorObject)
          .find((d) => d);
        const toObject = (investment["Recipient"] || [])
          .map(getActorObject)
          .find((d) => d);
        if (!fromObject || !toObject) return;
        if (fromObject.opacity < 0.5 || toObject.opacity < 0.5) return;

        const from = getActorCountry(fromObject);
        const to = getActorCountry(toObject);

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
          fromId: fromObject.id,
          toId: toObject.id,
          animatedTime: 1500,
          dashLength: 0.4,
          dashGap: 0.2,
          altitudeAutoScale: 0.6,
          initialColor: `rgba(32, 190, 201, ${arcOpacity})`,
        };
      })
      .filter((d) => d);

    let collaborations = [];

    allData["Actors"].forEach((actor) => {
      const collaboratorNames =
        actor["Directly Associated Orgs (e.g., employment/parent org):"] || [];

      collaboratorNames.forEach((collaborator) => {
        const fromObject = actor;
        const toObject = getActorObject(collaborator);
        if (!toObject) return;

        if (fromObject.opacity < 0.5 || toObject.opacity < 0.5) return;

        const from = getActorCountry(fromObject);
        const to = getActorCountry(toObject);
        if (!from || !to) return;

        const fromOffset = getCountryOffset(fromObject);
        const toOffset = getCountryOffset(toObject);

        collaborations = [
          ...collaborations,
          {
            from: { ...from, offset: fromOffset },
            to: { ...to, offset: toOffset },
            name: `${fromObject.label} - ${toObject.label}`,
            startLat: from.centroid[1] + fromOffset[1],
            startLng: from.centroid[0] + fromOffset[0],
            endLat: to.centroid[1] + toOffset[1],
            endLng: to.centroid[0] + toOffset[0],
            fromId: fromObject.id,
            toId: toObject.id,
            animatedTime: 0,
            dashLength: undefined,
            dashGap: 0,
            altitudeAutoScale: 0.3,
            initialColor: `rgba(188, 135, 151, ${arcOpacity})`,
          },
        ];
      });
    });

    const arcs = [...investments, ...collaborations];

    const filteredArcs = arcs
      .map((arc) => {
        const isHighlighted =
          !hoveredItem ||
          arc.fromId === hoveredItem.id ||
          arc.toId === hoveredItem.id;
        return {
          ...arc,
          sortOrder: isHighlighted ? 1 : 0,
          color: isHighlighted
            ? multiplyRgbaOpacity(arc.initialColor, 1)
            : multiplyRgbaOpacity(arc.initialColor, 0),
        };
      })
      .sort((a, b) => b.sortOrder - a.sortOrder);

    const pathGenerator = geoPath(projection, ctx);
    filteredArcs.forEach(({ startLat, startLng, endLat, endLng, color }) => {
      ctx.beginPath();
      pathGenerator({
        type: "LineString",
        coordinates: [
          projection.invert([startLng, startLat]),
          projection.invert([endLng, endLat]),
        ],
      });
      ctx.strokeWidth = 2;
      ctx.strokeStyle = color;
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
  const onClick = (e) => {
    const [x, y] = pointer(e);
    const pointIndex = voronoi.find(x, y);
    const point = bubbles[pointIndex];
    const distance = getDistanceFromXY([point.x - x, point.y - y]);
    if (distance > 100) {
      setFocusedItem();
    } else {
      setFocusedItem(point);
    }
  };

  return (
    <div className="Map" ref={ref}>
      {/* <div className="Map__controls" style={{ width: "20em" }}>
        <Select
          options={projectionNameOptionsParsed}
          value={projectionNameOptionsParsed.find(
            (d) => d.label === projectionName
          )}
          onChange={({ value }) => setProjectionName(value)}
        />
      </div> */}
      <canvas
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoveredItem()}
        onClick={onClick}
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
export const projectionNameOptionsParsed = projectionNameOptions.map(
  (projectionNameOption) => ({
    label: projectionNameOption,
    value: projectionNameOption,
  })
);

const multiplyRgbaOpacity = (rgb, opacityMultiplier) => {
  const currentOpacity = +rgb.split(/[\,\)]/g)[3];
  const newOpacity = currentOpacity * opacityMultiplier;
  return rgb.split(",").slice(0, -1).join(",") + ", " + newOpacity + ")";
};
