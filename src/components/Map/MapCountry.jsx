import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import countryCentersMap from "./country-centers.json";

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
import countryNamesMap from "./countryNamesMap.json"
import MapTooltipCountry from "./MapTooltipCountry";

import "./Map.css";
import { fromPairs } from "lodash";
import { contributionAreaColors, contributionAreas } from "../../constants";

const sphere = { type: "Sphere" };
const countryAccessor = (d) => d["Primary Operating Geography (Country)"];
const spiralPositions = getSpiralPositions(100, 5, 2, 1.2);

const MapWrapper = ({ allData, data, projectionName, setFocusedItem }) => {
  const [ref, dms] = useChartDimensions();
  const [blankMap, setBlankMap] = useState();
  const [hoveredItem, setHoveredItem] = useState();
  const arcsRef = useRef([]);
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

  const getCentroid = (country) => projection(countryCentersMap[country]);

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
    const mitigationAreaPositions = fromPairs(contributionAreas.map((d, i) => [d, [
      [-width * 0.008, width * 0.004],
      [0, -width * 0.008],
      [width * 0.008, width * 0.004],
    ][i]]))
    data.forEach(([countryName, actors]) => {
      const lookupName = countryNamesMap[countryName] || countryName;
      const country = Object.values(countryShapes).find(
        (d) => d.properties.geounit === lookupName
      );
      if (!country) return;
      const centroid = getCentroid(country.properties.geounit);
      if (!centroid) return;

      contributionAreas.forEach((mitigationArea) => {
        const offset = mitigationAreaPositions[mitigationArea]
        const relevantActors = actors.filter(actor => (actor["mainContributionArea"] || []).includes(mitigationArea) && !(actor.opacity < 1))
        const count = relevantActors.length;
        if (!count) return

        bubbles.push({
          countryName,
          mitigationArea,
          // name: `${countryName} working on ${mitigationArea}`,
          name: "",
          x: centroid[0] + offset[0],
          y: centroid[1] + offset[1],
          r: width * 0.06,
          alt: count * 0.01,
          color: contributionAreaColors[mitigationArea],
          relevantActors,
        });
      })

    });

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
    const getCountryOffset = (source, mitigationArea) => {
      const filteredCountries = data.find(
        ([country]) => country === countryAccessor(source)
      );
      if (!filteredCountries) return [0, 0];

      const spiralPosition = mitigationAreaPositions[mitigationArea]
      if (!spiralPosition) return [0, 0]

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
        if (!(fromObject["mainContributionArea"] || []).length || !(toObject["mainContributionArea"] || []).length) return;
        const fromOffset = mitigationAreaPositions[fromObject["mainContributionArea"][0]]
        const toOffset = mitigationAreaPositions[toObject["mainContributionArea"][0]]
        const fromColor = contributionAreaColors[fromObject["mainContributionArea"][0]];
        const toColor = contributionAreaColors[toObject["mainContributionArea"][0]];

        return {
          from: { ...from, offset: fromOffset, mainContributionArea: fromObject["mainContributionArea"][0] },
          to: { ...to, offset: toOffset, mainContributionArea: toObject["mainContributionArea"][0] },
          startLat: from.centroid[1] + fromOffset[1],
          startLng: from.centroid[0] + fromOffset[0],
          endLat: to.centroid[1] + toOffset[1],
          endLng: to.centroid[0] + toOffset[0],
          fromId: fromObject["id"],
          toId: toObject["id"],
          fromName: fromObject["label"],
          toName: toObject["label"],
          animatedTime: 5100,
          dashLength: 0.4,
          dashGap: 0.1,
          altitudeAutoScale: 0.6,
          initialColor: [
            fromColor,
            toColor,
          ],
        };
      })
      .filter((d) => d);

    let collaborations = [];

    allData["Actors"].forEach((actor) => {
      const collaboratorNames = [
        ...(actor["Directly Associated Orgs (e.g., employment/parent org):"] ||
          []),
        ...(actor["Partners With"] || []),
      ];

      collaboratorNames.forEach((collaborator) => {
        const fromObject = actor;
        const toObject = getActorObject(collaborator);
        if (!toObject) return;

        if (fromObject.opacity < 0.5 || toObject.opacity < 0.5) return;

        const from = getActorCountry(fromObject);
        const to = getActorCountry(toObject);
        if (!(fromObject["mainContributionArea"] || []).length || !(toObject["mainContributionArea"] || []).length) return;

        const fromOffset = mitigationAreaPositions[fromObject["mainContributionArea"][0]]
        const toOffset = mitigationAreaPositions[toObject["mainContributionArea"][0]]
        const fromColor = contributionAreaColors[fromObject["mainContributionArea"][0]];
        const toColor = contributionAreaColors[toObject["mainContributionArea"][0]];
        collaborations = [
          ...collaborations,
          {
            from: { ...from, offset: fromOffset, mainContributionArea: fromObject["mainContributionArea"][0] },
            to: { ...to, offset: toOffset, mainContributionArea: toObject["mainContributionArea"][0] },
            startLat: from.centroid[1] + fromOffset[1],
            startLng: from.centroid[0] + fromOffset[0],
            endLat: to.centroid[1] + toOffset[1],
            endLng: to.centroid[0] + toOffset[0],
            fromId: fromObject["id"],
            toId: toObject["id"],
            fromName: fromObject["label"],
            toName: toObject["label"],
            animatedTime: 0,
            dashLength: undefined,
            dashGap: 0,
            altitudeAutoScale: 0.3,
            initialColor: [
              fromColor,
              toColor,
            ],
          },
        ];
      });
    });

    const arcs = [...investments, ...collaborations].filter(d => !(d.startLat === d.endLat && d.startLng === d.endLng));
    return { bubbles, arcs };
  }, [data, projection]);

  const filteredArcs = React.useMemo(() => {
    return arcs
      .map((arc) => {
        const isHighlighted =
          !hoveredItem ||
          ((
            (arc.from.name === hoveredItem.countryName && arc.from.mainContributionArea === hoveredItem.mitigationArea)
            ||
            (arc.to.name === hoveredItem.countryName && arc.to.mainContributionArea === hoveredItem.mitigationArea)
          ));
        return {
          ...arc,
          sortOrder: isHighlighted ? 1 : 0,
          color: isHighlighted ? arc.initialColor : ["transparent", "transparent"]
        };
      })
      .sort((a, b) => b.sortOrder - a.sortOrder);
  }, [arcs, hoveredItem]);

  const voronoi = useMemo(() => Delaunay.from(bubbles.map((d) => [d.x, d.y])), [
    bubbles,
  ]);

  const drawBubbles = () => {
    if (!canvasElement.current) return;
    if (!blankMap) return;

    const ctx = canvasElement.current.getContext("2d");

    ctx.putImageData(blankMap, 0, 0);

    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#5da17c";
    const r = 3;
    bubbles.forEach(({ id, color, opacity, x, y }) => {
      ctx.beginPath();
      ctx.globalAlpha = opacity
      ctx.fillStyle = color
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1

    arcsRef.current = arcs;

    const pathGenerator = geoPath(projection, ctx);

    ctx.beginPath();
    pathGenerator(sphere);
    ctx.save();
    ctx.clip();

    filteredArcs.forEach(({ startLat, startLng, endLat, endLng, color }) => {
      try {
        ctx.beginPath();
        pathGenerator({
          type: "LineString",
          coordinates: [
            projection.invert([startLng, startLat]),
            projection.invert([endLng, endLat]),
          ],
        });
      } catch (e) {
        console.log(e);
      }
      ctx.strokeWidth = 2;
      const gradient = ctx.createLinearGradient(startLng, startLat, endLng, endLat);
      gradient.addColorStop(0, color[0]);
      gradient.addColorStop(1, color[1]);
      ctx.strokeStyle = gradient;
      ctx.stroke();
    });
    ctx.restore(); // stop clipping

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
      const relationships = arcsRef.current
        .map((arc) => {
          const isHighlighted =
            arc.fromId === point.id || arc.toId === point.id;
          if (!isHighlighted) return;
          return {
            ...arc,
          };
        })
        .filter(Boolean);
      setHoveredItem({ ...point, relationships });
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
      {!!hoveredItem && <MapTooltipCountry data={hoveredItem} />}

      <div className="Map__legend">
        Each bar represents organizations within a country that are focused on {contributionAreas.map((area, i) => (
          <Fragment key={area}>
            <span style={{
              fontWeight: 600,
              color: contributionAreaColors[area]
            }}>{area}</span>
            {i !== contributionAreas.length - 2 ? ', ' : ', and '}
          </Fragment>
        ))}growing taller with more organizations.
        <br />
        The arcs show collaborations between countries.
      </div>
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
