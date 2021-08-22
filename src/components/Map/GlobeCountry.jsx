import React, { useMemo, useRef, useState } from "react";
import uniq from "lodash/uniq";
import flatten from "lodash/flatten";
import fromPairs from "lodash/fromPairs";
// import { MeshPhongMaterial, Color } from "three";

import countryShapes from "./countries.json";
import countryCentersMap from "./country-centers.json";
import { getSpiralPositions } from "../../utils";
import Globe from "react-globe.gl";
// import BlankMap from "./BlankMap";
import MapTooltipCountry from "./MapTooltipCountry";
import countryNamesMap from "./countryNamesMap.json"
import mapImageUrl from "./map.png";

import "./Globe.css";
import { contributionAreaColors, contributionAreas } from "../../constants";

const countryAccessor = (d) => d["Primary Operating Geography (Country)"];
const spiralPositions = getSpiralPositions(100, 5, 2, 1.1);

const getCentroid = (country) => countryCentersMap[country];

const GlobeWrapper = ({ allData, data, setFocusedItem, imageName }) => {
  const [hoveredItem, setHoveredItem] = useState();
  // const [blankMapTextureImage, setBlankMapTextureImage] = useState();
  const globeElement = useRef();

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

  // const globeMaterial = useMemo(() => {
  //   if (!blankMapTextureImage) return;
  //   const globeMaterial = new MeshPhongMaterial();
  //   globeMaterial.specularMap = blankMapTextureImage;
  //   globeMaterial.specular = new Color("grey");
  //   globeMaterial.shininess = 15;
  //   return globeMaterial;
  // }, [blankMapTextureImage]);

  // useEffect(() => {
  //   setTimeout(() => {
  //     // wait for scene to be populated (asynchronously)
  //     const directionalLight = globeElement.current
  //       .scene()
  //       .children.find((obj3d) => obj3d.type === "DirectionalLight");
  //     directionalLight && directionalLight.position.set(1, 1, 1); // change light position to see the specularMap's effect
  //   });
  // }, []);

  const onGlobeLoad = () => {
    const scene = globeElement.current.scene();
    // ambient light
    scene.children[1].intensity = 1.36;
    // directional light
    scene.children[2].intensity = 0.1;

    scene.rotation.y = 0.5 * Math.PI;
    scene.rotation.x = 0.15 * Math.PI;
  };

  const xScale = 0.26;
  const yScale = 0.2;

  const arcOpacity = 0.8;
  const { bubbles, arcs } = useMemo(() => {
    // const heightScale = scaleLinear()
    //   .domain(extent(data.map((d) => d[1].length)))
    //   .range([0.1, 0.6]);

    let bubbles = [];
    const mitigationAreaPositions = fromPairs(contributionAreas.map((d, i) => [d, spiralPositions[i]]))
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
          lng: centroid[0] + offset.x * xScale,
          lat: centroid[1] + offset.y * yScale,
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

      return [spiralPosition.x * xScale, spiralPosition.y * yScale];
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
        const fromOffset = getCountryOffset(fromObject, fromObject["mainContributionArea"][0]);
        const toOffset = getCountryOffset(toObject, toObject["mainContributionArea"][0]);

        return {
          from: { ...from, offset: fromOffset },
          to: { ...to, offset: toOffset },
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
            `rgba(32, 190, 201, ${arcOpacity})`,
            `rgba(134, 111, 172, ${arcOpacity})`,
            // `rgba(255, 0, 0, ${arcOpacity})`,
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

        const fromOffset = getCountryOffset(fromObject, fromObject["mainContributionArea"]);
        const toOffset = getCountryOffset(toObject, toObject["mainContributionArea"]);

        collaborations = [
          ...collaborations,
          {
            from: { ...from, offset: fromOffset },
            to: { ...to, offset: toOffset },
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
              `rgba(188, 135, 151, ${arcOpacity})`,
              `rgba(239, 209, 201, ${arcOpacity})`,
            ],
          },
        ];
      });
    });

    const arcs = [...investments, ...collaborations];

    return { bubbles, arcs };
  }, [data]);

  const filteredArcs = React.useMemo(() => {
    return arcs
      .map((arc) => {
        const isHighlighted =
          !hoveredItem ||
          arc.fromId === hoveredItem.id ||
          arc.toId === hoveredItem.id;
        return {
          ...arc,
          sortOrder: isHighlighted ? 1 : 0,
          color: isHighlighted
            ? arc.initialColor.map((d) => multiplyRgbaOpacity(d, 1))
            : arc.initialColor.map((d) => multiplyRgbaOpacity(d, 0)),
        };
      })
      .sort((a, b) => b.sortOrder - a.sortOrder);
  }, [arcs, hoveredItem]);

  const onPointHover = (e, f) => {
    if (!e) {
      setHoveredItem(null);
      return;
    }
    const relationships = arcs
      .map((arc) => {
        const isHighlighted = arc.fromId === e.id || arc.toId === e.id;
        if (!isHighlighted) return;
        return {
          ...arc,
        };
      })
      .filter(Boolean);
    setHoveredItem({ ...e, relationships });
  };

  return (
    <div className="Globe">
      {!!hoveredItem && <MapTooltipCountry data={hoveredItem} />}
      {/* <BlankMap onImageUpdate={setBlankMapTextureImage} /> */}

      <Globe
        ref={globeElement}
        globeImageUrl={
          imageName === "day"
            ? `//unpkg.com/three-globe/example/img/earth-day.jpg`
            : `//unpkg.com/three-globe/example/img/earth-blue-marble.jpg`
        }
        // globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        // globeImageUrl={mapImageUrl}
        // globeMaterial={globeMaterial}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        // backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="#E2E8EE"
        pointsData={bubbles}
        pointAltitude={(d) => d["alt"]}
        pointRadius={0.5}
        pointColor={(d) => d.color}
        // pointsMerge={true}
        onPointHover={onPointHover}
        arcsData={filteredArcs}
        // arcColor={() => "#45aeb1"}
        arcColor={(d) => d.color}
        arcStroke={0.5}
        arcAltitudeAutoScale={(d) => d.altitudeAutoScale}
        arcDashLength={(d) => d.dashLength}
        arcDashGap={(d) => d.dashGap}
        arcDashAnimateTime={(d) => d.animatedTime}
        arcsTransitionDuration={1}
        onGlobeReady={onGlobeLoad}
        onPointClick={setFocusedItem}
      // pointOfView={{ lat: 38, lng: -97, altitude: 2.5 }}
      // ref={globeElement}
      // onMapReady={() => {
      //   globeElement.current.pointOfView({
      //     lat: 39.6,
      //     lng: -98.5,
      //     altitude: 2,
      //   });
      // }}

      // pointsData={myData}
      />
    </div>
  );
};

export default GlobeWrapper;

const multiplyRgbaOpacity = (rgb, opacityMultiplier) => {
  const currentOpacity = +rgb.split(/[\,\)]/g)[3];
  const newOpacity = currentOpacity * opacityMultiplier;
  return rgb.split(",").slice(0, -1).join(",") + ", " + newOpacity + ")";
};
