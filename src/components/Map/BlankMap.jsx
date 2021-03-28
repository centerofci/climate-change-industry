import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  geoNaturalEarth1,
  geoMercator,
  geoPath,
  geoGraticule10,
  Delaunay,
  pointer,
  geoEqualEarth,
  geoEquirectangular,
} from "d3";

import { scaleCanvas } from "./../../utils";
import countryShapes from "./countries.json";

const sphere = { type: "Sphere" };

const BlankMap = ({ onImageUpdate }) => {
  const canvasElement = useRef();

  const width = 1200;

  const projectionFunction = geoEquirectangular;

  useEffect(() => {
    if (!canvasElement.current) return;
    try {
      const projection = projectionFunction().fitWidth(width, sphere);

      const ctx = canvasElement.current.getContext("2d");

      const pathGenerator = geoPath(projection, ctx);
      const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);
      const height = y1;
      canvasElement.current.height = height;
      canvasElement.current.width = width;

      scaleCanvas(canvasElement.current, ctx, width, height);

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

      if (width > 0 && onImageUpdate) {
        onImageUpdate(ctx.getImageData(0, 0, width * 2, height * 2));
        onSaveImage();
      }
    } catch (e) {
      console.log(e);
      return {};
    }
  }, [canvasElement.current]);

  const onSaveImage = () => {
    var image = canvasElement.current
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream"); // here is the most important part because if you dont replace you will get a DOM 18 exception.

    window.location.href = image;
  };

  return (
    <canvas
      className="BlankMap"
      ref={canvasElement}
      style={{
        position: "absolute",
        left: "calc(-200vw - 100%)",
      }}
    />
  );
};

export default BlankMap;
